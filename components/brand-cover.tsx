/* eslint-disable @next/next/no-img-element */
/** Shared, immutable identity page. Kept outside editable product sections. */
export function BrandCover() {
  return <div className="fb-cover" data-brand-cover="fruidam" aria-label="열매담 공통 브랜드 표지">
    <div className="fb-frame">
      <div className="fb-topline"><span>ROOTED IN CARE</span><span>FRUIDAM · GROW TOGETHER</span></div>
      <div className="fb-logo"><img src="/fruitdam-logo.png" alt="열매담 FRUIDAM" width={1774} height={887}/></div>
      <div className="fb-emblem" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="56"/><path d="M60 89V50m0 19C35 69 27 52 29 36c19 0 31 12 31 33Zm0-10c0-23 13-36 33-36 1 22-11 36-33 36ZM44 92h32"/></svg></div>
      <span className="fb-eyebrow">FROM OUR FARMS, TO YOUR TABLE</span>
      <h2 className="fb-title">산지의 신선함을,<br/>당신의 식탁으로.</h2>
      <p className="fb-copy">햇살과 바람, 농부의 정성으로 기른 과일.<br/>수확의 기쁨이 일상의 한 입으로 이어지도록<br/>열매담이 산지와 당신을 잇습니다.</p>
      <div className="fb-journey"><span><small>01 · ORIGIN</small>산지의 정성</span><i/><span><small>02 · CONNECT</small>온라인의 연결</span><i/><span><small>03 · EVERYDAY</small>식탁의 기쁨</span></div>
      <p className="fb-signature">좋은 과일을 만나, 좋은 일상을 담다.</p>
      <div className="fb-bottomline"><span>땅에서 시작한 이야기, 열매담</span><span>FRUIDAM</span></div>
    </div>
  </div>;
}

// Embedded into the exported HTML as well as the live editor.
export const brandCoverStyles = `
.fb-cover{container-type:inline-size;width:100%;background:#263f30;color:#f5f1e6;text-align:center;position:relative;overflow:clip;font-family:'Noto Sans KR',sans-serif;box-sizing:border-box;isolation:isolate}
.fb-cover *{box-sizing:border-box}.fb-cover .fb-frame{margin:3.25cqw;border:1px solid #b9bd9466;position:relative;padding:3.7cqw 5cqw 3.5cqw;background:radial-gradient(ellipse at 50% 42%,#59725033,transparent 65%)}
.fb-cover .fb-topline,.fb-cover .fb-bottomline{display:flex;justify-content:space-between;align-items:center;color:#c1c7a9;font-size:1.05cqw;letter-spacing:.21cqw;line-height:1.5}
.fb-cover .fb-logo{position:relative;width:23cqw;aspect-ratio:1311/641;overflow:hidden;margin:6cqw auto 4.5cqw}.fb-cover .fb-logo img{position:absolute;left:-18.4592%;top:-24.025%;width:135.3166%;height:138.3775%;max-width:none;filter:brightness(0) invert(96%) sepia(12%) saturate(300%);object-fit:fill}
.fb-cover .fb-emblem{width:12cqw;height:12cqw;margin:0 auto 5cqw;color:#bdc59c}.fb-cover .fb-emblem svg{width:100%;height:100%;stroke:currentColor;stroke-width:1}.fb-cover .fb-emblem path{stroke-width:1.6}
.fb-cover .fb-eyebrow{display:block;color:#c5cba8;font-size:1.15cqw;letter-spacing:.3cqw;line-height:1.6}
.fb-cover .fb-title{font-family:'Gowun Batang',serif;font-weight:400;font-size:6.3cqw;line-height:1.5;letter-spacing:-.23cqw;color:#f5f1e6;margin:2.8cqw 0 3cqw;padding:0;max-width:none;text-shadow:none}
.fb-cover .fb-copy{font-size:1.85cqw;line-height:2.1;color:#d3d8c6;letter-spacing:.02cqw;margin:0;padding:0}
.fb-cover .fb-journey{display:flex;align-items:center;justify-content:center;gap:3cqw;margin:7.5cqw 0 4cqw;border-top:1px solid #c2c79e55;border-bottom:1px solid #c2c79e55;padding:3cqw 0;font-size:1.8cqw;line-height:1.6}.fb-cover .fb-journey span{display:block}.fb-cover .fb-journey small{display:block;font-size:.95cqw;letter-spacing:.13cqw;color:#b9c29f;margin-bottom:.9cqw}.fb-cover .fb-journey i{width:3cqw;height:1px;background:#a7b18e}
.fb-cover .fb-signature{font-family:'Gowun Batang',serif;font-size:2cqw;line-height:1.7;margin:0 0 5cqw;color:#e0e3d0}.fb-cover .fb-bottomline{font-size:1cqw;border-top:1px solid #c2c79e44;padding-top:2cqw}
`;
