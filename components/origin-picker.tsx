"use client";

import { useId, useState } from "react";
import regions from "@/lib/korea-regions.json";

const aliases: Record<string, string[]> = {
  서울특별시: ["서울"], 부산광역시: ["부산"], 대구광역시: ["대구"],
  인천광역시: ["인천"], 대전광역시: ["대전"], 울산광역시: ["울산"],
  세종특별자치시: ["세종"], 경기도: ["경기"], 강원특별자치도: ["강원도", "강원"],
  충청북도: ["충북"], 충청남도: ["충남"], 전북특별자치도: ["전라북도", "전북"],
  경상북도: ["경북"], 경상남도: ["경남"], 제주특별자치도: ["제주도", "제주"],
  전남광주통합특별시: ["광주광역시", "전라남도", "광주", "전남"],
};

function initialSelection(origin: string) {
  if (!origin) return { province: "", district: "" };
  if (/^(국내산|국산)$/.test(origin.trim())) return { province: "domestic", district: "" };
  const location = origin.replace(/^(국내산|국산)\s*[·ㆍ,/-]?\s*/, "").trim();
  for (const province of regions.provinces) {
    for (const alias of [province.name, ...(aliases[province.name] || [])]) {
      if (location !== alias && !location.startsWith(`${alias} `)) continue;
      const remainder = location.slice(alias.length).trim();
      if (!remainder) return { province: province.code, district: "" };
      const district = province.districts.find(item => item.name === remainder || item.name.replace(/[시군구]$/, "") === remainder);
      if (district) return { province: province.code, district: district.code };
    }
  }
  return { province: "existing", district: "" };
}

export function OriginPicker({ initialOrigin = "" }: { initialOrigin?: string }) {
  const id = useId();
  const [selection, setSelection] = useState(() => initialSelection(initialOrigin));
  const [changed, setChanged] = useState(false);
  const province = regions.provinces.find(item => item.code === selection.province);
  const district = province?.districts.find(item => item.code === selection.district);
  const origin = !changed ? initialOrigin : selection.province === "domestic" ? "국내산" : province ? `국내산 · ${province.name}${district ? ` ${district.name}` : ""}` : initialOrigin;

  return <div className="fd-origin-picker" role="group" aria-labelledby={`${id}-title`}>
    <span id={`${id}-title`} className="fd-origin-title">원산지</span>
    <input type="hidden" name="origin" value={origin}/>
    <div className="fd-form-row">
      <label>시·도<select required aria-label="원산지 시·도" value={selection.province} onChange={event => { setChanged(true); setSelection({ province: event.target.value, district: "" }); }}>
        <option value="" disabled>시·도를 선택해주세요</option>
        <option value="domestic">국내산 (상세 지역 미지정)</option>
        {initialOrigin && <option value="existing">기존 원산지 유지: {initialOrigin}</option>}
        {regions.provinces.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select></label>
      <label>시·군·구<select aria-label="원산지 시·군·구" value={selection.district} disabled={!province?.districts.length} onChange={event => { setChanged(true); setSelection({ ...selection, district: event.target.value }); }}>
        <option value="">{province ? province.districts.length ? "전체 / 상세 지역 미지정" : "별도 시·군·구 없음" : "시·도를 먼저 선택해주세요"}</option>
        {province?.districts.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select></label>
    </div>
    <small className="fd-caption" aria-live="polite">{origin ? `저장할 원산지: ${origin}` : "시·도를 선택한 뒤 시·군·구를 선택할 수 있습니다."}</small>
  </div>;
}
