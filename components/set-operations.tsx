"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { operate, parseNumbers, type Operation } from "@/lib/set-operations";

const operations: { value: Operation; label: string; hint: string }[] = [
  { value: "intersection", label: "交集（与）", hint: "留下 A、B 都有的号码" },
  { value: "union", label: "并集（或）", hint: "合并 A、B，自动去重" },
  { value: "aMinusB", label: "A 减 B", hint: "从 A 中去掉 B 有的号码" },
  { value: "bMinusA", label: "B 减 A", hint: "从 B 中去掉 A 有的号码" },
  { value: "xor", label: "对称差集（异或）", hint: "留下只在其中一组出现的号码" },
];

export function SetOperations({ inputA, onInputAChange, onFilter }: {
  inputA: string;
  onInputAChange: (text: string) => void;
  onFilter: (numbers: string[]) => void;
}) {
  const fileInputs = useRef<Partial<Record<"A" | "B", HTMLInputElement | null>>>({});
  const [imported, setImported] = useState<Partial<Record<"A" | "B", { text: string; count: number }>>>({});
  const [inputB, setInputB] = useState("");
  const [operation, setOperation] = useState<Operation>("intersection");
  const [showPreview, setShowPreview] = useState(false);
  const [previewNotice, setPreviewNotice] = useState("");
  const [notice, setNotice] = useState("");
  let result: string[] = [];
  let error = "";
  let countA = 0;
  let countB = 0;
  try {
    const a = parseNumbers(inputA);
    const b = parseNumbers(inputB);
    countA = a.length;
    countB = b.length;
    result = operate(a, b, operation);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "请检查数据格式";
  }
  const ready = !error && Boolean(inputA.trim() || inputB.trim());

  async function importFile(file: File | undefined, side: "A" | "B") {
    if (!file) return;
    try {
      const text = await file.text();
      const numbers = parseNumbers(text);
      if (side === "A") onInputAChange(text); else setInputB(text);
      setImported((previous) => ({ ...previous, [side]: { text, count: numbers.length } }));
      setNotice(`已导入数据 ${side}`);
    } catch (cause) {
      setNotice(`导入失败：${cause instanceof Error ? cause.message : "无法读取文件"}`);
    }
  }

  return <Card>
    <CardHeader><CardTitle>两组数据运算</CardTitle>
      <p className="text-sm font-normal text-gray-600">每个号码为四位，保留开头的 0。支持空格、换行或逗号分隔，自动去重；空白按空集合处理。</p>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {(["A", "B"] as const).map((side) => <div key={side} className="space-y-2">
          <label htmlFor={`set-${side}`} className="block">数据 {side}</label>
          <Textarea id={`set-${side}`} value={side === "A" ? inputA : inputB} onChange={(e) => {
            if (side === "A") onInputAChange(e.target.value); else setInputB(e.target.value);
            setNotice("");
          }} placeholder={side === "A" ? "0001 0002" : "0002 0003"} className="min-h-40 font-mono" />
          <input ref={(element) => { fileInputs.current[side] = element; }} type="file" accept=".txt,text/plain" className="hidden" aria-label={`选择数据 ${side} 的 TXT 文件`} onChange={(e) => {
            void importFile(e.target.files?.[0], side);
            e.target.value = "";
          }} />
          <Button type="button" onClick={() => fileInputs.current[side]?.click()}
            className={`w-full h-auto px-4 sm:px-8 py-3 text-base sm:text-lg font-bold text-white transition-colors ${imported[side]?.text === (side === "A" ? inputA : inputB) ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}>
            {imported[side]?.text === (side === "A" ? inputA : inputB) ? `数据 ${side} 已导入 ${imported[side]?.count} 组` : `导入 ${side} 的 TXT 文件`}
          </Button>
        </div>)}
      </div>
      <fieldset><legend className="mb-2">选择运算方式</legend>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{operations.map((item) => <Button type="button" key={item.value} aria-pressed={operation === item.value}
          onClick={() => { setOperation(item.value); setNotice(""); }}
          className={`h-auto px-4 py-3 text-base font-bold border transition-colors ${operation === item.value ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"}`}>
          {item.label}
        </Button>)}</div>
        <p className="mt-2 text-sm font-normal text-gray-600">{operations.find((item) => item.value === operation)?.hint}</p>
      </fieldset>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {ready && <p aria-live="polite" className="text-sm text-gray-600">A：{countA} 组 · B：{countB} 组（已去重）</p>}
      <Button disabled={!ready} onClick={() => { setPreviewNotice(""); setShowPreview(true); }}
        className="w-full h-auto bg-red-500 hover:bg-red-600 text-white px-4 sm:px-8 py-3 text-base sm:text-lg font-bold disabled:bg-gray-400">
        预览筛选{ready && ` (${result.length}组)`}
      </Button>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85dvh] gap-0 overflow-y-auto">
          <DialogTitle className="text-lg font-semibold">数据预览</DialogTitle>
          <div className="bg-white border-b border-gray-200 pb-3 mb-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <DialogDescription className="text-sm text-gray-600">共筛选出 {result.length} 组数据</DialogDescription>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>取消</Button>
                <Button disabled={!result.length} className="bg-green-500 hover:bg-green-600" onClick={async () => {
                  try { await navigator.clipboard.writeText(result.join(" ")); setPreviewNotice("复制成功！"); }
                  catch { setPreviewNotice("复制失败，请手动选择结果复制"); }
                }}>复制</Button>
                <Button disabled={!result.length} className="bg-green-500 hover:bg-green-600" onClick={() => {
                  const url = URL.createObjectURL(new Blob([result.join(" ")], { type: "text/plain;charset=utf-8" }));
                  const link = document.createElement("a");
                  link.href = url; link.download = `两组运算-${operation}.txt`; link.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}>导出</Button>
              </div>
            </div>
          </div>
          <Button variant="outline" className="mb-3 w-full" disabled={!result.length} onClick={() => {
            setShowPreview(false);
            onFilter(result);
          }}>用此结果继续筛选 →</Button>
          <div className="bg-gray-100 p-4 rounded-md max-h-60 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words text-sm">{result.length ? result.join(" ") : "运算结果为空，没有符合条件的号码。"}</pre>
          </div>
          <p className="mt-3 text-sm text-gray-500">继续筛选会替换原输入数据，并保留当前筛选条件。</p>
          {previewNotice && <p role="status" className="mt-2 text-sm">{previewNotice}</p>}
        </DialogContent>
      </Dialog>
      <p role="status" className="text-sm">{notice}</p>
    </CardContent>
  </Card>;
}
