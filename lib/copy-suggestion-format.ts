/** Editorial instructions are not replacement copy and must never be inserted. */
export function isAdvisorySuggestion(value: string) {
  return /(?:수정|명시|기재|보완|대체|재작성)\s*(?:하(?:세요|십시오|거나|는|기)|해\s*(?:주세요|야|보세요))|(?:표현|문구).{0,35}(?:권장합니다|권장드립니다)|다음과\s*같이\s*(?:수정|작성)/.test(value);
}
