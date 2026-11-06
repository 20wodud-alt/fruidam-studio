"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ArrowUp, Check, ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
import { optionName, supplyImages, type Member, type SupplyOption, type SupplyProduct } from "@/lib/commerce";
import { prepareImageUpload } from "@/lib/client-upload";
import { OriginPicker } from "@/components/origin-picker";
import { FormattedNumberInput } from "@/components/formatted-number-input";

type Props={product:SupplyProduct|null;busy:boolean;serverError?:string;suppliers?:Member[];defaultSupplierId?:string;operator?:boolean;onSubmit:(payload:Record<string,unknown>)=>Promise<void>};
export function SupplyProductForm({product,busy,onSubmit,serverError,suppliers,defaultSupplierId,operator=false}:Props){
  const [images,setImages]=useState<string[]>(product?supplyImages(product):[]);
  const [uploading,setUploading]=useState(false),[error,setError]=useState("");
  const [options,setOptions]=useState<SupplyOption[]>(product?.options.map(option=>({...option,label:option.customLabel===false?"":option.label}))||[{id:crypto.randomUUID(),label:"",price:0,stock:0}]);
  const currentYear=Number(new Intl.DateTimeFormat("en",{year:"numeric",timeZone:"Asia/Seoul"}).format(new Date()));
  function change(index:number,patch:Partial<SupplyOption>){setOptions(items=>items.map((item,i)=>i===index?{...item,...patch}:item));}
  async function addPhotos(files:FileList|null){
    if(!files?.length||uploading)return;
    if(images.length+files.length>10){setError("사진은 최대 10장까지 등록할 수 있습니다.");return;}
    setUploading(true);setError("");
    try{for(const file of Array.from(files)){const body=new FormData();body.set("file",await prepareImageUpload(file));const response=await fetch("/api/uploads",{method:"POST",body});const result=await response.json();if(!response.ok)throw Error(result.error||"사진을 올리지 못했습니다.");setImages(items=>[...items,result.url]);}}
    catch(e){setError(e instanceof Error?e.message:"사진을 올리지 못했습니다. 업로드된 사진은 유지됩니다.");}
    finally{setUploading(false);}
  }
  return <form className="fd-form fd-supply-form" onSubmit={e=>{e.preventDefault();if(uploading||busy)return;setError("");if(options.some(o=>!optionName(o))){setError("각 옵션의 옵션명 또는 중량·규격을 입력해주세요.");return;}const fields=new FormData(e.currentTarget);void onSubmit({...Object.fromEntries(fields),id:product?.id,image:images[0]||"",images,options:options.map(o=>({...o,label:optionName(o),customLabel:!!o.label.trim()}))});}}>
    <fieldset disabled={busy}><legend>기본 정보</legend>
      {suppliers&&<label>공급처<select name="supplierId" defaultValue={product?.supplierId||defaultSupplierId} required>{suppliers.map(m=><option key={m.id} value={m.id}>{m.role==="admin"?`${m.name} · 운영자 직접 관리`:m.name}</option>)}</select><small>직접 관리하거나 승인된 농가·직매장을 선택하세요.</small></label>}
      <label>상품명<input name="name" required maxLength={100} defaultValue={product?.name} placeholder="예: 정품 부사 사과"/></label>
      <input type="hidden" name="badge" value=""/>
      <div className="fd-form-row"><label>상품 분류<select name="category" defaultValue={product?.category}>{["사과·배","감귤·만감류","포도·기타"].map(c=><option key={c}>{c}</option>)}</select></label><label>품종<input name="variety" maxLength={100} defaultValue={product?.variety} placeholder="예: 부사"/></label></div>
      <OriginPicker initialOrigin={product?.origin}/>
      <label>상품 특징·안내<textarea name="features" required rows={4} maxLength={3000} defaultValue={product?.features} placeholder="실제 상품의 특징과 구성, 셀러에게 안내할 내용을 입력하세요."/></label>
    </fieldset>
    <fieldset disabled={busy}><legend>상품 사진 <span>{images.length}/10장</span></legend>
      <p className="fd-caption">첫 번째 사진이 대표 이미지입니다. JPG·PNG·WebP·AVIF, 한 장당 최대 8MB.</p>
      <label className="fd-photo-upload"><ImagePlus size={21}/>{uploading?"사진을 업로드하고 있습니다…":"상품 사진 추가 · 여러 장 선택 가능"}<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading||images.length>=10} onChange={e=>{void addPhotos(e.target.files);e.target.value="";}}/></label>
      {!!images.length&&<div className="fd-photo-editor">{images.map((image,index)=><div key={image} className="fd-photo-editor-item"><img src={image} alt={`상품 사진 ${index+1}`}/><span>{index===0?"대표 사진":`사진 ${index+1}`}</span><div>{index>0&&<button type="button" disabled={uploading} onClick={()=>setImages(items=>[image,...items.filter(src=>src!==image)])}><ArrowUp size={12}/>대표로</button>}<button type="button" disabled={uploading} aria-label={`상품 사진 ${index+1} 삭제`} onClick={()=>setImages(items=>items.filter(src=>src!==image))}><X size={13}/>삭제</button></div></div>)}</div>}
      <label className="fd-checkbox"><input type="checkbox" required/>제공 자료를 셀러의 판매 채널에서 사용하도록 동의합니다.</label>
    </fieldset>
    <fieldset disabled={busy}><legend>상품·보관 정보</legend>
      <div className="fd-form-row"><label>과세 여부<select name="taxStatus" defaultValue={product?.taxStatus||"unspecified"}><option value="unspecified">미입력</option><option value="tax_free">비과세</option><option value="taxable">과세</option></select></label><label>생산연도<input name="productionYear" type="number" min={2000} max={currentYear+1} defaultValue={product?.productionYear??""} placeholder={`예: ${currentYear}`}/></label></div>
      <label>보관구분<select name="storageType" defaultValue={product?.storageType||""}><option value="">선택해주세요</option><option>냉장보관</option><option>실온보관</option><option>냉동보관</option><option>기타</option></select></label>
      <label>보관안내<textarea name="storageInstructions" rows={3} maxLength={1500} defaultValue={product?.storageInstructions} placeholder="상품에 맞는 보관 온도·방법·섭취 안내를 입력하세요."/></label>
    </fieldset>
    <fieldset disabled={busy}><legend>배송·출고 정보</legend>
      <label>기본 배송비 표시<input value="무료배송" readOnly/><input type="hidden" name="shippingLabel" value="free"/></label>
      <div className="fd-form-row"><label>출고형태<select name="dispatchType" defaultValue={product?.dispatchType||"산지출고"}>{Array.from(new Set(["산지출고","센터출고",...(product?.dispatchType?[product.dispatchType]:[])])).map(value=><option key={value}>{value}</option>)}</select></label><label>택배사<input name="carrier" maxLength={60} defaultValue={product?.carrier} placeholder="예: CJ대한통운"/></label></div>
      <div className="fd-form-row"><label>제주 추가 배송비 (원)<FormattedNumberInput name="jejuSurcharge" initialValue={product?.jejuSurcharge||0} max={1000000}/></label><label>도서산간 추가 배송비 (원)<FormattedNumberInput name="remoteSurcharge" initialValue={product?.remoteSurcharge||0} max={1000000}/></label></div>
      <p className="fd-caption">기본 배송은 무료입니다. 제주·도서산간 추가 배송비는 별도로 적용됩니다.</p>
      <div className="fd-form-row"><label>주문 마감 시간<input type="time" name="cutoff" required defaultValue={product?.cutoff||"12:00"}/></label><label>출고 예정·배송 안내<input name="shipping" required maxLength={200} defaultValue={product?.shipping} placeholder="예: 평일 주문 다음 영업일 출고"/></label></div>
    </fieldset>
    <fieldset disabled={busy}><legend>옵션별 구성·공급가·재고</legend>
      <p className="fd-caption">등급·중량·크기·과수를 입력하면 옵션명을 자동으로 구성합니다. 직접 입력한 옵션명이 있으면 우선 사용합니다.</p>
      {options.map((option,index)=><section className="fd-option-editor" key={option.id}>
        <div className="fd-between"><strong>옵션 {index+1}</strong><button type="button" className="fd-text-link" disabled={options.length===1} aria-label={`옵션 ${index+1} 삭제`} onClick={()=>setOptions(items=>items.filter((_,i)=>i!==index))}><X size={14}/>삭제</button></div>
        <div className="fd-form-row"><label>등급<input value={option.grade||""} maxLength={60} placeholder="예: 정품" onChange={e=>change(index,{grade:e.target.value})}/></label><label>중량<input value={option.weight||""} maxLength={60} placeholder="예: 2kg" onChange={e=>change(index,{weight:e.target.value})}/></label></div>
        <div className="fd-form-row"><label>크기·규격<input value={option.size||""} maxLength={60} placeholder="예: 중소과" onChange={e=>change(index,{size:e.target.value})}/></label><label>과수·개수<input value={option.fruitCount||""} maxLength={60} placeholder="예: 13과 내외" onChange={e=>change(index,{fruitCount:e.target.value})}/></label></div>
        <label>옵션명 (직접 지정)<input value={option.label} maxLength={200} placeholder="비워두면 위 구성으로 자동 생성" onChange={e=>change(index,{label:e.target.value})}/></label>
        <div className="fd-form-row"><label>배송비 포함 공급가<FormattedNumberInput initialValue={option.price} min={100} max={10000000} required onValueChange={price=>change(index,{price})}/></label><label>출고 가능 수량<FormattedNumberInput initialValue={option.stock} max={100000} required onValueChange={stock=>change(index,{stock})}/></label></div>
        <small className="fd-option-preview">표시: {optionName(option)||"옵션 구성을 입력해주세요."}</small>
      </section>)}
      <button type="button" className="fd-button outline" disabled={options.length>=20} onClick={()=>setOptions(items=>[...items,{id:crypto.randomUUID(),label:"",price:0,stock:0}])}><Plus size={15}/>옵션 추가 ({options.length}/20)</button>
    </fieldset>
    {(error||serverError)&&<p className="fd-form-error" role="alert">{error||serverError}</p>}
    <p className="fd-caption">{operator&&product?"운영자가 수정하는 기존 상품은 판매 상태를 유지합니다. 공급처를 변경하거나 사진을 모두 삭제하면 다시 검수합니다.":"등록·수정한 상품은 검수 후 공개됩니다."} 과세 여부·생산연도·보관 정보는 입력한 내용을 그대로 안내합니다.</p>
    <button className="fd-button" disabled={busy||uploading}>{busy||uploading?<LoaderCircle className="spin" size={17}/>:<Check size={17}/>} {operator&&product?"상품 수정 저장":"상품 검수 요청"}</button>
  </form>;
}
