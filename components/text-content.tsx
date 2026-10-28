import type { TextFormat } from "@/lib/studio";

// Uses actual text and CSS, so text remains selectable and works in offline exports.
export function TextContent({ text, format }: { text: string; format?: TextFormat }) {
  if (!format?.curve && !format?.highlight && !format?.superscript && (!format?.listStyle || format.listStyle === "none")) return text;
  const decorate = (value: string) => {
    const content = format.curve ? <span className="dp-curve-line" style={{ paddingBlock: `${Math.abs(format.curve) * .45}px` }}>{Array.from(value).map((character, index, characters) => {
      const t = characters.length < 2 ? 0 : index / (characters.length - 1) * 2 - 1;
      return <span key={index} style={{ display: "inline-block", transform: `translateY(${format.curve! * (t * t - .5) * .45}px) rotate(${format.curve! * t * .35}deg)` }}>{character === " " ? "\u00a0" : character}</span>;
    })}</span> : value;
    return <span style={{ backgroundColor: format.highlight, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{format.superscript ? <sup>{content}</sup> : content}</span>;
  };
  if (format.listStyle === "bullet" || format.listStyle === "number") {
    return <span className="dp-text-list" role="list">{text.split("\n").filter(line => line.trim()).map((line, index) => <span role="listitem" key={index}><span className="dp-list-marker" aria-hidden="true">{format.listStyle === "number" ? `${index + 1}.` : "•"}</span><span>{decorate(line)}</span></span>)}</span>;
  }
  return format.curve ? <>{text.split("\n").map((line, index) => <span className="dp-curve-row" key={index}>{decorate(line)}</span>)}</> : decorate(text);
}
