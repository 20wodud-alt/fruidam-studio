"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, type ReactNode } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { optionName, supplyImages, taxLabels, won, type SupplyProduct } from "@/lib/commerce";

export function SupplyProductDetails({product,children}:{product:SupplyProduct;children:ReactNode}){
  const images=supplyImages(product),[active,setActive]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const priced=product.options.map(o=>o.price).filter(price=>price>0);
  async function download(){setBusy(true);setError("");try{const {default:JSZip}=await import("jszip");const zip=new JSZip();for(const [index,source]of images.entries()){const response=await fetch(source);if(!response.ok)throw Error("상품 사진을 내려받지 못했습니다.");const blob=await response.blob();const extension=blob.type.includes("svg")?"svg":blob.type.includes("png")?"png":blob.type.includes("jpeg")?"jpg":"webp";zip.file(`상품사진-${String(index+1).padStart(2,"0")}.${extension}`,await blob.arrayBuffer());}const file=await zip.generateAsync({type:"blob"});const url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download=`${product.name.replace(/[\\/:*?"<>|]/g,"").slice(0,70)||"상품"}-사진.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){setError(e instanceof Error?e.message:"사진 다운로드에 실패했습니다.");}finally{setBusy(false);}}
  return <div className="fd-product-detail">
    <div className="fd-product-gallery"><img className="fd-gallery-main" src={images[active]||"/photos/fruit-apple.webp"} alt={`${product.name} 상품 사진 ${active+1}`}/>{images.length>1&&<div className="fd-gallery-thumbnails">{images.map((image,index)=><button key={image} type="button" aria-label={`상품 사진 ${index+1} 보기`} aria-pressed={active===index} onClick={()=>setActive(index)}><img src={image} alt=""/></button>)}</div>}{!!images.length&&<button type="button" className="fd-button outline small" disabled={busy} onClick={()=>void download()}>{busy?<LoaderCircle size={14} className="spin"/>:<Download size={14}/>}이미지 전체 다운로드 ({images.length}장)</button>}</div>
    <div className="fd-product-info"><span className="fd-eyebrow">{product.badge||product.category} · {product.demo?"체험용 상품 예시":product.supplier}</span>
    <div className="fd-detail-price">{product.demo?"제작 체험용":priced.length?`${won(Math.min(...priced))}부터`:"유료 이용 후 공급가 공개"}</div>
    <p className="fd-detail-features">{product.features}</p>
    <dl className="fd-product-facts">
      <div><dt>배송비</dt><dd>{product.shippingLabel==="free"?"무료배송":"기본 배송비 공급가 포함"}{(!!product.jejuSurcharge||!!product.remoteSurcharge)&&<small>{product.remoteSurcharge?`도서산간 +${won(product.remoteSurcharge)}`:""}{product.remoteSurcharge&&product.jejuSurcharge?" · ":""}{product.jejuSurcharge?`제주 +${won(product.jejuSurcharge)}`:""}</small>}</dd></div>
      <div><dt>과세 여부</dt><dd>{taxLabels[product.taxStatus||"unspecified"]}</dd></div>
      <div><dt>출고형태</dt><dd>{product.dispatchType||"미입력"}</dd></div>
      <div><dt>택배사</dt><dd>{product.carrier||"미입력"}</dd></div>
      <div><dt>원산지</dt><dd>{product.origin}</dd></div>
      {product.variety&&<div><dt>품종</dt><dd>{product.variety}</dd></div>}
      <div><dt>생산연도</dt><dd>{product.productionYear?`${product.productionYear}년`:"미입력"}</dd></div>
      <div><dt>보관구분</dt><dd>{product.storageType||"미입력"}</dd></div>
      <div><dt>보관안내</dt><dd>{product.storageInstructions||"미입력"}</dd></div>
      <div><dt>주문 마감</dt><dd>{product.cutoff}</dd></div>
      <div><dt>출고 안내</dt><dd>{product.shipping}</dd></div>
    </dl>
    <h3 className="fd-detail-option-heading">옵션</h3>
    {product.options.map(option=><div className="fd-option-row" key={option.id}><div><strong>{optionName(option)}</strong>{[option.grade,option.weight,option.size,option.fruitCount].some(Boolean)&&option.label!==optionName({...option,label:""})&&<small>{[option.grade,option.weight,option.size,option.fruitCount].filter(Boolean).join(" / ")}</small>}</div><span>{product.demo?"제작 체험용":option.price?won(option.price):"공급가 비공개"}</span>{!product.demo&&<small>출고 가능 {option.stock}개</small>}</div>)}
    {product.demo&&<p className="fd-caption">사진과 상품 정보는 이용 흐름을 설명하는 예시입니다. 실제 상품 발주는 불가합니다.</p>}
    {error&&<p className="fd-form-error" role="alert">{error}</p>}
    {children}</div>
  </div>;
}
