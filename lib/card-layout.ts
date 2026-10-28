// Shared by the editor, review preview and downloaded page.
export const cardLayoutStyles = `
.product-page .dp-points{grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch;gap:20px 24px}
.product-page .dp-point{min-width:0;height:100%}
.product-page .dp-point p{margin:0;min-width:0;text-align:left}
.product-page .dp-points[data-count="1"],.product-page .dp-points[data-count="3"]{grid-template-columns:minmax(0,1fr)}
.product-page .dp-points[data-count="3"] .dp-point{display:grid;grid-template-columns:100px minmax(0,1fr);align-items:center;gap:24px;min-height:110px;padding:24px}
.product-page .dp-points[data-count="3"] .dp-point b{margin:0;white-space:nowrap}
.product-page .dp-points:has(>.dp-point:last-child:nth-child(odd))>.dp-point:last-child{grid-column:1/-1}
.product-page .dp-points:has(>.dp-point:last-child:nth-child(odd)):not([data-count="1"]):not([data-count="3"])>.dp-point:last-child{min-height:0}
.product-page.layout-minimal .dp-points{grid-template-columns:minmax(0,1fr);gap:0}
.product-page.layout-minimal .dp-point{display:grid;grid-template-columns:100px minmax(0,1fr);gap:24px;align-items:center;height:auto;min-height:0;padding:24px 12px}
.product-page .dp-benefits>.dp-image{margin-top:38px}
.product-page .dp-option{align-items:center;min-width:0}
.product-page .dp-option>span{flex:0 0 88px;white-space:nowrap;padding-top:0}
.product-page .dp-option>p{flex:1;min-width:0;text-align:left;word-break:keep-all}
`;
