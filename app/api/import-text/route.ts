import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length")) > 2.2 * 1024 * 1024) return NextResponse.json({ error: "문서 파일은 2MB 이하로 첨부해주세요." }, { status: 413 });
    const data = await request.formData(); const file = data.get("file");
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024) throw new Error("2MB 이하의 문서 파일이 필요해요.");
    const extension = file.name.split(".").pop()?.toLowerCase();
    const buffer = await file.arrayBuffer();
    let content = "";
    if (extension === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      for (const sheet of workbook.worksheets.slice(0, 3)) {
        for (let row = 1; row <= Math.min(sheet.rowCount, 200); row++) {
          const values: string[] = [];
          for (let col = 1; col <= Math.min(sheet.columnCount, 20); col++) values.push(sheet.getRow(row).getCell(col).text);
          content += values.filter(Boolean).join(" · ") + "\n";
          if (content.length >= 12000) break;
        }
        if (content.length >= 12000) break;
      }
    } else if (["txt", "md", "csv"].includes(extension || "")) {
      const utf8 = new TextDecoder("utf-8").decode(buffer);
      content = utf8.includes("\uFFFD") ? new TextDecoder("euc-kr").decode(buffer) : utf8;
      if (content.includes("\0")) throw new Error("텍스트 문서 형식이 올바르지 않아요.");
    } else throw new Error("TXT, MD, CSV, XLSX 파일을 첨부해주세요.");
    if (!content.trim()) throw new Error("문서에서 읽을 수 있는 텍스트가 없어요.");
    return NextResponse.json({ text: content.trim().slice(0, 12000), name: file.name.slice(0, 200), truncated: content.trim().length > 12000 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "문서를 읽지 못했어요." }, { status: 400 }); }
}
