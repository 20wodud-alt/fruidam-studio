"use client";
import { Check, Download, FileText, ImagePlus } from "lucide-react";
import { marketProfiles, type MarketImageFormat, type MarketPlatform } from "@/lib/market-export";
export function MarketDownloadOptions({ platform, onPlatform, format, onFormat, busy, onImages, onHtml }: { platform: MarketPlatform; onPlatform: (p: MarketPlatform) => void; format: MarketImageFormat; onFormat: (f: MarketImageFormat) => void; busy: boolean; onImages: () => void; onHtml: () => void }) {
  const profile = marketProfiles[platform];
  return <>
    <fieldset className="market-export-settings" disabled={busy}><legend>업로드할 플랫폼</legend><div className="market-export-platforms">{(Object.keys(marketProfiles) as MarketPlatform[]).map(id => <button type="button" key={id} className={platform === id ? "selected" : ""} aria-pressed={platform === id} onClick={() => onPlatform(id)}><span><strong>{marketProfiles[id].name}</strong><small>가로 {marketProfiles[id].width}px</small></span>{platform === id && <Check size={17}/>}</button>)}</div>
      <label className="market-export-format">이미지 형식<select aria-label="다운로드 이미지 형식" value={format} onChange={e => onFormat(e.target.value as MarketImageFormat)}><option value="jpg">JPG · 용량 절약</option><option value="png">PNG · 무손실</option></select></label>
    </fieldset>
    <div className="market-export-spec"><strong>{profile.note}</strong><p>숨긴 섹션을 제외한 상세페이지 전체를 위에서 아래까지 이어 붙여, 긴 이미지 파일 1개로 저장합니다.</p><small>선택한 가로 비율을 유지하며 JPG 또는 PNG로 바로 다운로드합니다.</small><a href={profile.source} target="_blank" rel="noreferrer">플랫폼 공식 안내 보기 ↗</a></div>
    <div className="download-options"><button disabled={busy} onClick={onImages}><ImagePlus size={24}/><span><strong>{profile.name}용 긴 이미지 1개</strong><small>{profile.width}px {format.toUpperCase()} · 전체 상세페이지 한 장</small></span><Download size={17}/></button><button disabled={busy} onClick={onHtml}><FileText size={24}/><span><strong>보관용 웹페이지 HTML</strong><small>선택한 너비로 저장 · 사진·글꼴 포함 · 오프라인 확인용</small></span><Download size={17}/></button></div>
  </>;
}
