import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Part = 1 | 2 | 3 | 4 | 5;
type EpisodeProps = { part: Part };
type Beat = { headline: string; caption: string; kind: "room" | "phone" | "map" | "crowd" | "desk" | "door" };
type EpisodeData = { title: string; accent: string; beats: Beat[] };

const DATA: Record<Part, EpisodeData> = {
  1: { title: "ТЕПЕРЬ ТЫ РЕШАЕШЬ ЗА ВСЕХ", accent: "#f2bd54", beats: [
    { headline: "ОБЫЧНОЕ УТРО", caption: "Ты просыпаешься и замечаешь странное уведомление.", kind: "room" },
    { headline: "ЭТО НЕ РОЗЫГРЫШ", caption: "Весь мир признал одного руководителя. И это ты.", kind: "phone" },
    { headline: "МИР ЖДЁТ ОТВЕТА", caption: "Новости подтверждают: теперь решения зависят от тебя.", kind: "crowd" },
    { headline: "ПЕРВОЕ РЕШЕНИЕ", caption: "Ты обещаешь остановить войны и защитить людей.", kind: "desk" },
    { headline: "МИЛЛИАРДЫ ОЖИДАЮТ", caption: "Впервые планета ждёт ответа от одного человека.", kind: "map" },
    { headline: "НО ЕСТЬ ПРОБЛЕМА", caption: "Страны требуют от тебя противоположных решений…", kind: "phone" },
  ]},
  2: { title: "ПЕРВЫЕ 24 ЧАСА У ВЛАСТИ", accent: "#70d8c0", beats: [
    { headline: "КАРТА ПЛАНЕТЫ", caption: "Каждая точка на экране — чья-то настоящая жизнь.", kind: "map" },
    { headline: "НЕ ХВАТАЕТ ВРАЧЕЙ", caption: "В одном городе больницы ждут помощи.", kind: "phone" },
    { headline: "ПОСЛЕ ШТОРМА", caption: "Другие районы остались без электричества.", kind: "crowd" },
    { headline: "ПОМОЩЬ В ПУТИ", caption: "Ты направляешь ресурсы туда, где они нужнее.", kind: "desk" },
    { headline: "ПЕРВЫЕ РЕЗУЛЬТАТЫ", caption: "Больницы получают оборудование, спасатели — поддержку.", kind: "map" },
    { headline: "НЕРАВНОЕ РАСПРЕДЕЛЕНИЕ", caption: "Но некоторые регионы почти ничего не получили.", kind: "phone" },
  ]},
  3: { title: "ОДНИ ПРАВИЛА ДЛЯ ВСЕХ?", accent: "#f3a36c", beats: [
    { headline: "ЕДИНЫЙ ПОРЯДОК", caption: "Ты хочешь, чтобы правила были справедливыми.", kind: "desk" },
    { headline: "ПЕРВЫЙ СПОР", caption: "Одинаковые законы подходят далеко не всем.", kind: "crowd" },
    { headline: "РАЗНЫЕ ТРАДИЦИИ", caption: "У народов разные языки, история и условия.", kind: "map" },
    { headline: "СОВЕТ ЭКСПЕРТОВ", caption: "Каждый специалист уверен в своём решении.", kind: "desk" },
    { headline: "ГОЛОС ЖИТЕЛЕЙ", caption: "Теперь люди могут обсуждать важные перемены.", kind: "phone" },
    { headline: "НЕ ВСЕМ ЭТО НРАВИТСЯ", caption: "Твои решения впервые начинают оспаривать.", kind: "door" },
  ]},
  4: { title: "САМАЯ ОПАСНАЯ ОШИБКА", accent: "#c5a4ff", beats: [
    { headline: "ПРОШЛО НЕСКОЛЬКО МЕСЯЦЕВ", caption: "Мир стал спокойнее, но отчёты противоречат друг другу.", kind: "desk" },
    { headline: "ЭКОНОМИСТЫ СПОРЯТ", caption: "Одни требуют сократить расходы.", kind: "phone" },
    { headline: "ВРАЧИ ПРОСЯТ ПОМОЩИ", caption: "Другие настаивают на поддержке больниц.", kind: "crowd" },
    { headline: "НИКТО НЕ ЗНАЕТ ВСЁ", caption: "Ты не можешь быть экспертом во всех вопросах.", kind: "map" },
    { headline: "ЗАКРЫТЫЙ ДОКЛАД", caption: "Люди боятся сообщать руководству о его ошибках.", kind: "phone" },
    { headline: "ПРОБЛЕМА В СИСТЕМЕ", caption: "Никто не решается сказать правителю: ты неправ.", kind: "door" },
  ]},
  5: { title: "ПОСЛЕДНЕЕ РЕШЕНИЕ", accent: "#8ec7ff", beats: [
    { headline: "НЕОЖИДАННЫЙ ВЫБОР", caption: "Ты решаешь не усиливать власть, а разделить её.", kind: "room" },
    { headline: "НЕЗАВИСИМЫЕ СУДЫ", caption: "Теперь решения можно проверять и оспаривать.", kind: "desk" },
    { headline: "ГОЛОС РЕГИОНОВ", caption: "Люди участвуют в обсуждении общих правил.", kind: "map" },
    { headline: "НОВАЯ СИСТЕМА", caption: "Решения становятся точнее и открытее.", kind: "crowd" },
    { headline: "ПОСЛЕДНЕЕ ОБРАЩЕНИЕ", caption: "Планета больше не должна зависеть от одного человека.", kind: "phone" },
    { headline: "ГЛАВНЫЙ ВЫВОД", caption: "Лучшая система — та, которой не нужен единственный правитель.", kind: "door" },
  ]},
};

const Character: React.FC<{ expression: number }> = ({ expression }) => (
  <svg viewBox="0 0 360 500" width="390" height="540" role="img" aria-label="Мультяшный герой в жёлтой куртке">
    <ellipse cx="180" cy="482" rx="142" ry="15" fill="#080a16" opacity=".6" />
    <path d="M38 480 Q43 350 110 330 L180 310 L250 330 Q318 350 322 480Z" fill="#d99b32" stroke="#34233d" strokeWidth="9" />
    <path d="M130 332 L180 380 L230 332 L248 480 L112 480Z" fill="#287d83" stroke="#34233d" strokeWidth="7" />
    <path d="M145 295 L145 345 Q180 370 215 345 L215 295Z" fill="#efbd9d" />
    <ellipse cx="180" cy="205" rx="112" ry="125" fill="#f1c7a8" stroke="#34233d" strokeWidth="9" />
    <path d="M70 190 Q50 78 145 58 Q225 25 278 105 Q300 145 286 204 L263 151 Q235 125 200 130 Q150 111 105 157 L93 219Z" fill="#58372f" stroke="#34233d" strokeWidth="9" />
    <path d="M171 63 Q185 22 226 35 Q212 63 190 82" fill="#58372f" stroke="#34233d" strokeWidth="8" />
    <ellipse cx="139" cy="210" rx="9" ry="13" fill="#2b2838" /><ellipse cx="220" cy="210" rx="9" ry="13" fill="#2b2838" />
    <circle cx="139" cy="210" r="31" fill="none" stroke="#252338" strokeWidth="7" /><circle cx="220" cy="210" r="31" fill="none" stroke="#252338" strokeWidth="7" />
    <path d="M170 208 L189 208 M180 220 L171 252 L187 254" fill="none" stroke="#252338" strokeWidth="7" strokeLinecap="round" />
    <path d={expression % 2 === 0 ? "M151 278 Q180 296 209 278" : "M153 286 Q180 267 207 286"} fill="none" stroke="#8e4e55" strokeWidth="7" strokeLinecap="round" />
    <circle cx="104" cy="254" r="9" fill="#e99b8e" opacity=".55" /><circle cx="256" cy="254" r="9" fill="#e99b8e" opacity=".55" />
    <path d="M180 384 L180 480" stroke="#e9c37b" strokeWidth="5" opacity=".8" /><circle cx="180" cy="411" r="6" fill="#f6d58d" />
  </svg>
);

const Phone: React.FC<{ accent: string; frame: number; part: Part }> = ({ accent, frame, part }) => (
  <div style={{ width: 360, height: 620, border: "12px solid #171725", borderRadius: 54, background: "#090d19", boxShadow: "0 28px 70px #0009", padding: 24, position: "relative", transform: `rotate(${Math.sin(frame / 18) * 1.2}deg)` }}>
    <div style={{ width: 100, height: 16, borderRadius: 20, background: "#171725", margin: "0 auto 45px" }} />
    <div style={{ color: "#b7c4d8", fontSize: 19, letterSpacing: 3 }}>МИРОВОЙ ЦЕНТР</div>
    <div style={{ color: accent, fontSize: 48, fontWeight: 900, marginTop: 32, lineHeight: 1.1 }}>{part === 1 ? "1" : part === 2 ? "24/7" : part === 3 ? "ГОЛОС" : part === 4 ? "ОТЧЁТ" : "✓"}</div>
    <div style={{ height: 2, background: "#ffffff22", margin: "26px 0" }} />
    {[0, 1, 2].map((item) => <div key={item} style={{ padding: 18, marginBottom: 16, borderRadius: 18, background: "#171d2c", borderLeft: `6px solid ${accent}` }}><div style={{ width: "72%", height: 12, borderRadius: 8, background: "#dce5f4", opacity: .8 }} /><div style={{ width: item === 1 ? "45%" : "88%", height: 9, borderRadius: 8, background: "#7f8ca5", marginTop: 12 }} /></div>)}
    <div style={{ position: "absolute", bottom: 30, left: 30, right: 30, borderRadius: 22, padding: 18, background: accent, color: "#101321", textAlign: "center", fontSize: 20, fontWeight: 900 }}>НОВОЕ СООБЩЕНИЕ</div>
  </div>
);

const MapPanel: React.FC<{ accent: string; frame: number }> = ({ accent, frame }) => (
  <svg viewBox="0 0 700 470" width="660" height="450" role="img" aria-label="Стилизованная карта мира">
    <rect x="4" y="4" width="692" height="462" rx="35" fill="#101b30" stroke="#7186a7" strokeOpacity=".35" strokeWidth="5" />
    <path d="M90 110 L170 70 235 95 250 150 220 190 245 235 190 270 145 230 105 190Z M300 95 L365 70 430 90 465 140 425 180 390 165 360 220 320 185Z M465 260 L535 230 610 260 590 330 520 365 480 330Z" fill="#375a72" stroke="#83b6c5" strokeWidth="5" />
    {Array.from({ length: 18 }, (_, i) => { const x = 105 + ((i * 79) % 500); const y = 90 + ((i * 47) % 285); const pulse = 5 + Math.sin(frame / 9 + i) * 2; return <g key={i}><circle cx={x} cy={y} r={pulse + 8} fill={accent} opacity=".12" /><circle cx={x} cy={y} r={pulse} fill={accent} /></g>; })}
    <text x="350" y="420" textAnchor="middle" fill="#dce9f5" fontSize="22" letterSpacing="5">ГЛОБАЛЬНАЯ СИСТЕМА</text>
  </svg>
);

const Background: React.FC<{ accent: string; frame: number }> = ({ accent, frame }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #33304b 0%, #17182a 48%, #090b15 100%)" }}>
    <div style={{ position: "absolute", inset: 0, opacity: .15, backgroundImage: "linear-gradient(#8b8ba8 1px, transparent 1px), linear-gradient(90deg, #8b8ba8 1px, transparent 1px)", backgroundSize: "72px 72px", transform: `translateY(${frame % 72}px)` }} />
    <div style={{ position: "absolute", width: 780, height: 780, borderRadius: "50%", background: accent, filter: "blur(150px)", opacity: .12, top: 250, left: 150 }} />
  </AbsoluteFill>
);

const Visual: React.FC<{ beat: Beat; part: Part; accent: string; frame: number }> = ({ beat, part, accent, frame }) => {
  const bob = Math.sin(frame / 12) * 12;
  if (beat.kind === "phone") return <div style={{ position: "absolute", top: 500, left: 0, right: 0, display: "flex", justifyContent: "center" }}><Phone accent={accent} frame={frame} part={part} /></div>;
  if (beat.kind === "map") return <div style={{ position: "absolute", top: 570, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${bob}px)` }}><MapPanel accent={accent} frame={frame} /></div>;
  if (beat.kind === "crowd") return <div style={{ position: "absolute", top: 700, left: 70, right: 70, display: "flex", justifyContent: "space-around", alignItems: "end" }}>{Array.from({ length: 3 }, (_, i) => <div key={i} style={{ textAlign: "center", transform: `translateY(${Math.sin(frame / 11 + i) * 10}px) scale(${.8 + (i % 3) * .1})` }}><Character expression={i + frame} /></div>)}</div>;
  if (beat.kind === "desk") return <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center" }}><div style={{ width: 820, height: 250, borderRadius: 28, background: "linear-gradient(90deg,#4c3040,#80543e,#4c3040)", border: "8px solid #30263a", position: "absolute", top: 380 }} /><div style={{ position: "relative", transform: `translateY(${bob}px)` }}><Character expression={frame} /></div></div>;
  if (beat.kind === "door") return <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", justifyContent: "center" }}><div style={{ width: 500, height: 780, border: "18px solid #47384a", borderRadius: 18, background: "linear-gradient(110deg,#362c43,#171725)", boxShadow: "0 25px 80px #0008", position: "relative" }}><div style={{ position: "absolute", right: 45, top: "50%", width: 22, height: 22, borderRadius: "50%", background: accent }} /></div><div style={{ position: "absolute", top: 180, transform: `translateX(${Math.sin(frame / 20) * 120}px)` }}><Character expression={frame} /></div></div>;
  return <div style={{ position: "absolute", top: 650, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${bob}px)` }}><Character expression={frame} /></div>;
};

export const Episode: React.FC<EpisodeProps> = ({ part }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = DATA[part];
  const beatIndex = Math.min(5, Math.floor(frame / (fps * 10)));
  const beat = data.beats[beatIndex];
  const local = frame % (fps * 10);
  const enter = interpolate(local, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const zoom = interpolate(local, [0, 300], [1.035, 1], { extrapolateRight: "clamp" });
  const progress = frame / (fps * 60);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0c17", color: "#f7f2ed", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <Audio src={staticFile(`audio/part-${part}.mp3`)} volume={1} />
      <Audio src={staticFile("soundtrack.wav")} volume={0.12} />
      <Background accent={data.accent} frame={frame} />
      <AbsoluteFill style={{ opacity: enter, transform: `scale(${zoom})` }}>
        <div style={{ position: "absolute", top: 75, left: 65, right: 65, display: "flex", justifyContent: "space-between", color: "#c4c2d2", fontSize: 22, letterSpacing: 4 }}><span>ИСТОРИЯ • ЧАСТЬ {part}/5</span><span>МИР • 2040</span></div>
        <div style={{ position: "absolute", top: 190, left: 60, right: 60, textAlign: "center" }}><div style={{ color: data.accent, fontSize: 25, fontWeight: 900, letterSpacing: 5, marginBottom: 26 }}>СЕРИЯ {part}</div><div style={{ fontSize: 55, lineHeight: 1.08, fontWeight: 900, textShadow: "0 8px 32px #000" }}>{beat.headline}</div></div>
        <Visual beat={beat} part={part} accent={data.accent} frame={frame} />
        <div style={{ position: "absolute", bottom: 260, left: 54, right: 54, minHeight: 178, padding: "28px 32px", borderRadius: 24, background: "rgba(5,7,16,.88)", border: "2px solid rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 15px 45px #0008" }}><div style={{ fontSize: 37, lineHeight: 1.25, fontWeight: 800 }}>{beat.caption}</div></div>
        <div style={{ position: "absolute", bottom: 120, left: 65, right: 65, height: 8, borderRadius: 10, background: "#ffffff28" }}><div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 10, background: data.accent }} /></div>
        <div style={{ position: "absolute", bottom: 65, left: 65, right: 65, display: "flex", justifyContent: "space-between", color: "#b8b5c8", fontSize: 22, letterSpacing: 3 }}><span>ЧТО БУДЕТ ДАЛЬШЕ?</span><span>{String(Math.floor(frame / fps / 60)).padStart(2, "0")}:{String(Math.floor(frame / fps) % 60).padStart(2, "0")}</span></div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PartOne: React.FC = () => <Episode part={1} />;
const PartTwo: React.FC = () => <Episode part={2} />;
const PartThree: React.FC = () => <Episode part={3} />;
const PartFour: React.FC = () => <Episode part={4} />;
const PartFive: React.FC = () => <Episode part={5} />;

export const FullSeries: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={1800}><PartOne /></Sequence>
    <Sequence from={1800} durationInFrames={1800}><PartTwo /></Sequence>
    <Sequence from={3600} durationInFrames={1800}><PartThree /></Sequence>
    <Sequence from={5400} durationInFrames={1800}><PartFour /></Sequence>
    <Sequence from={7200} durationInFrames={1800}><PartFive /></Sequence>
  </AbsoluteFill>
);
