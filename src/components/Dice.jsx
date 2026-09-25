"use client";

// A real 3D cube. Animation is driven by CSS classes in globals.css:
//   idle -> hovers gently | rolling -> thrown, bounces, tumbles | leaving -> slides away
const PIPS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};
const PIP_COLORS = { 1: "#F93334", 2: "#086AFA", 3: "#FF9F04", 4: "#03A47E", 5: "#086AFA", 6: "#F93334" };

export default function Dice({ phase = "idle", rx = 0, ry = 0 }) {
  return (
    <div className={`dice-stage ${phase}`} style={{ "--rx": `${rx}deg`, "--ry": `${ry}deg` }} aria-hidden>
      <div className="dice-scene">
        <div className="dice-x">
          <div className="dice-shadow" />
          <div className="dice-y">
            <div className="dice-cube">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className={`dice-face f${n}`} style={{ "--pip": PIP_COLORS[n] }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) =>
                    PIPS[n].includes(cell) ? <span key={cell} className="pip" style={{ gridArea: `${Math.ceil(cell / 3)} / ${((cell - 1) % 3) + 1}` }} /> : null
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
