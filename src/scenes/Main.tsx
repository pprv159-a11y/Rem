import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const chapters = [
  { title: "ОДИН ЧЕЛОВЕК. ВЕСЬ МИР.", kicker: "А ЧТО, ЕСЛИ ЭТО БУДЕШЬ ТЫ?", color: "#65d7ff" },
  { title: "ПЕРВЫЕ 24 ЧАСА", kicker: "МИР ЗАМЕР В ОЖИДАНИИ РЕШЕНИЙ", color: "#83e6c2" },
  { title: "ЕДИНЫЕ ПРАВИЛА", kicker: "НО У ВСЕХ РАЗНЫЕ ПРЕДСТАВЛЕНИЯ О СПРАВЕДЛИВОСТИ", color: "#f7c66b" },
  { title: "МИРОВАЯ ЭКОНОМИКА", kicker: "ОДНО РЕШЕНИЕ — МИЛЛИАРДЫ ПОСЛЕДСТВИЙ", color: "#ff927d" },
  { title: "НЕОЖИДАННЫЙ ВРАГ", kicker: "НЕ СОПЕРНИКИ. А ПРОТИВОРЕЧИВЫЕ СОВЕТЫ.", color: "#c6a5ff" },
  { title: "ЦЕНА АБСОЛЮТНОЙ ВЛАСТИ", kicker: "КТО СМОЖЕТ ОСПОРИТЬ ТВОЁ РЕШЕНИЕ?", color: "#ffb1c8" },
  { title: "ГЛАВНЫЙ ПОВОРОТ", kicker: "ЧТОБЫ СОХРАНИТЬ ВЛАСТЬ, НУЖНО ЕЁ РАЗДЕЛИТЬ", color: "#8be0d1" },
  { title: "МИР БЕЗ ЕДИНСТВЕННОГО ПРАВИТЕЛЯ", kicker: "ВОТ ЧТО МОЖЕТ СТАТЬ ТВОИМ НАСЛЕДИЕМ", color: "#9bc4ff" }
];

const captions = [
  "Представь: завтра утром весь мир признаёт только одного правителя. Тебя.",
  "Нет соперников. Нет выборов. Но что ты сделаешь с абсолютной властью?",
  "Ты объявляешь о прекращении войн. Миллионы людей празднуют.",
  "Но мир — не одна большая компания. У всех разные потребности.",
  "Решение, которое помогает одному региону, может навредить другому.",
  "Ты меняешь экономику. Но на бумаге всё проще, чем в реальности.",
  "Первый поворот: главная проблема — не враги, а противоречивые советы.",
  "Учёные, врачи и экономисты предлагают разные пути. Кого слушать?",
  "Даже добрый правитель может ошибиться. Кто сможет сказать ему «нет»?",
  "Ты понимаешь: чтобы сохранить мир, власть нужно разделить.",
  "Ты создаёшь систему, где решения можно проверять и оспаривать.",
  "Возможно, лучший правитель — тот, кто построил мир без единственного правителя."
];

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const chapterIndex = Math.min(chapters.length - 1, Math.floor(frame / (durationInFrames / chapters.length)));
  const chapter = chapters[chapterIndex];
  const localFrame = frame % Math.floor(durationInFrames / chapters.length);
  const fade = interpolate(localFrame, [0, 24, 1040, 1125], [0, 1, 1, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(localFrame, [0, 1125], [1.08, 1], { extrapolateRight: "clamp" });
  const captionIndex = Math.min(captions.length - 1, Math.floor(frame / (durationInFrames / captions.length)));
  const pulse = 0.5 + Math.sin(frame / 19) * 0.08;
  const isOpening = frame < fps * 8;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 38%, #263f68 0%, #101a31 42%, #050914 100%)", color: "white", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <Audio src={staticFile("narration.mp3")} volume={0.95} />
      <Audio src={staticFile("soundtrack.wav")} volume={0.16} />
      <AbsoluteFill style={{ opacity: 0.35, backgroundImage: "linear-gradient(rgba(120,170,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(120,170,255,.12) 1px, transparent 1px)", backgroundSize: "90px 90px", transform: `perspective(700px) rotateX(62deg) scale(1.8) translateY(240px)` }} />
      <div style={{ position: "absolute", width: 980, height: 980, borderRadius: "50%", left: "50%", top: "38%", transform: `translate(-50%,-50%) scale(${scale})`, background: "radial-gradient(circle at 35% 30%, #6c9ed0 0%, #315c91 20%, #142d53 48%, #071225 70%)", boxShadow: `0 0 100px ${chapter.color}55, inset -55px -35px 100px #020713`, opacity: 0.82 }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, border: `2px solid ${chapter.color}55`, borderRadius: "50%", left: "50%", top: "38%", transform: `translate(-50%,-50%) rotate(${frame * 0.035}deg)`, opacity: pulse }} />
      <div style={{ position: "absolute", top: 100, left: 70, right: 70, display: "flex", justifyContent: "space-between", fontSize: 26, letterSpacing: 8, color: "#b8c9e8" }}>
        <span>ПРЕДСТАВЬ</span><span>МИР • 2040</span>
      </div>
      <div style={{ position: "absolute", top: "30%", left: 72, right: 72, textAlign: "center", opacity: fade }}>
        <div style={{ color: chapter.color, fontSize: 29, fontWeight: 700, letterSpacing: 7, marginBottom: 34 }}>{chapter.kicker}</div>
        <div style={{ fontSize: isOpening ? 83 : 76, lineHeight: 1.12, fontWeight: 900, textShadow: "0 8px 40px #000", letterSpacing: -2 }}>{chapter.title}</div>
      </div>
      <div style={{ position: "absolute", bottom: 260, left: 70, right: 70, textAlign: "center", padding: "30px 34px", background: "rgba(3,8,20,.76)", border: "1px solid rgba(190,215,255,.22)", borderRadius: 28, backdropFilter: "blur(12px)", minHeight: 145, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 37, lineHeight: 1.28, fontWeight: 700 }}>{captions[captionIndex]}</div>
      </div>
      <div style={{ position: "absolute", bottom: 105, left: 70, right: 70, height: 7, borderRadius: 9, background: "#ffffff25" }}>
        <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", borderRadius: 9, background: chapter.color }} />
      </div>
      <div style={{ position: "absolute", bottom: 54, left: 70, right: 70, display: "flex", justifyContent: "space-between", color: "#9eb1d2", fontSize: 22, letterSpacing: 4 }}>
        <span>КТО УПРАВЛЯЕТ БУДУЩИМ?</span><span>{String(Math.floor(frame / fps / 60)).padStart(2,"0")}:{String(Math.floor(frame / fps) % 60).padStart(2,"0")}</span>
      </div>
    </AbsoluteFill>
  );
};
