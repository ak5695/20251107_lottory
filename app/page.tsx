"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LotteryApp() {
  const [inputData, setInputData] = useState("");
  const [processedData, setProcessedData] = useState<string[]>([]);
  const [excludedNumbers, setExcludedNumbers] = useState({
    thousands: new Set<number>(),
    hundreds: new Set<number>(),
    tens: new Set<number>(),
    units: new Set<number>(),
    thousandsHundreds: new Set<number>(),
    thousandsTens: new Set<number>(),
    thousandsUnits: new Set<number>(),
    hundredsTens: new Set<number>(),
    hundredsUnits: new Set<number>(),
    tensUnits: new Set<number>(),
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDataExpanded, setIsDataExpanded] = useState(true);
  const [generateSuccess, setGenerateSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showFloatingSuccess, setShowFloatingSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导入txt文件
  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setInputData(content);
          setErrorMessage("");

          // 计算导入的四位数字组数
          const numbers = content
            .trim()
            .split(/\s+/)
            .filter((num) => /^\d{4}$/.test(num));

          setImportedCount(numbers.length);
          setImportSuccess(true);
          // 导入数据后自动折叠输入区
          setIsDataExpanded(false);

          // 显示浮动成功提示
          setShowFloatingSuccess(true);
          setTimeout(() => setShowFloatingSuccess(false), 1000);
        };
        reader.readAsText(file);
      } else {
        setErrorMessage("请选择txt格式的文件");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }
  };

  // 切换排除数字
  const toggleExcluded = (
    position: keyof typeof excludedNumbers,
    number: number
  ) => {
    setExcludedNumbers((prev) => {
      const newSet = new Set(prev[position]);
      if (newSet.has(number)) {
        newSet.delete(number);
      } else {
        newSet.add(number);
      }
      return { ...prev, [position]: newSet };
    });
  };

  // 生成数据
  const generateData = () => {
    const numbers = inputData
      .trim()
      .split(/\s+/)
      .filter((num) => /^\d{4}$/.test(num));

    if (numbers.length === 0) {
      setErrorMessage("请输入有效的四位数字数据");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const filtered = numbers.filter((num) => {
      const digits = num.split("").map(Number);
      const [thousands, hundreds, tens, units] = digits;

      // 检查单个位置的排除
      if (
        excludedNumbers.thousands.has(thousands) ||
        excludedNumbers.hundreds.has(hundreds) ||
        excludedNumbers.tens.has(tens) ||
        excludedNumbers.units.has(units)
      ) {
        return false;
      }

      // 检查组合位置的排除（两位数字之和）
      const thousandsHundreds = thousands + hundreds;
      const thousandsTens = thousands + tens;
      const thousandsUnits = thousands + units;
      const hundredsTens = hundreds + tens;
      const hundredsUnits = hundreds + units;
      const tensUnits = tens + units;

      if (
        excludedNumbers.thousandsHundreds.has(thousandsHundreds) ||
        excludedNumbers.thousandsTens.has(thousandsTens) ||
        excludedNumbers.thousandsUnits.has(thousandsUnits) ||
        excludedNumbers.hundredsTens.has(hundredsTens) ||
        excludedNumbers.hundredsUnits.has(hundredsUnits) ||
        excludedNumbers.tensUnits.has(tensUnits)
      ) {
        return false;
      }

      return true;
    });

    setProcessedData(filtered);
    setShowSuccess(true);
    setGenerateSuccess(true);
    setShowFloatingSuccess(true);

    // 浮动成功提示1秒后消失
    setTimeout(() => setShowFloatingSuccess(false), 1000);
    // 成功提示2秒后消失
    setTimeout(() => setShowSuccess(false), 2000);
    // 按钮状态3秒后恢复
    setTimeout(() => setGenerateSuccess(false), 3000);
  };

  // 重置所有数据
  const resetAll = () => {
    setInputData("");
    setProcessedData([]);
    setExcludedNumbers({
      thousands: new Set<number>(),
      hundreds: new Set<number>(),
      tens: new Set<number>(),
      units: new Set<number>(),
      thousandsHundreds: new Set<number>(),
      thousandsTens: new Set<number>(),
      thousandsUnits: new Set<number>(),
      hundredsTens: new Set<number>(),
      hundredsUnits: new Set<number>(),
      tensUnits: new Set<number>(),
    });
    setErrorMessage("");
    setGenerateSuccess(false);
    setImportSuccess(false);
    setImportedCount(0);
    setResetSuccess(true);
    setIsDataExpanded(true);

    // 显示浮动成功提示
    setShowFloatingSuccess(true);
    setTimeout(() => setShowFloatingSuccess(false), 1000);

    // 3秒后重置按钮状态
    setTimeout(() => setResetSuccess(false), 3000);
  };

  // 导出数据
  const exportData = () => {
    const dataStr = processedData.join(" ");
    const blob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${processedData.length}组.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setShowPreview(false);
  };

  const renderNumberButtons = (
    position: keyof typeof excludedNumbers,
    label: string
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        <span className="font-medium mr-2 sm:mr-4 w-16 sm:w-20 shrink-0 text-right text-sm sm:text-lg">
          {label}
        </span>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => toggleExcluded(position, num)}
              className={`w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-semibold transition-colors ${
                excludedNumbers[position].has(num)
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-orange-400 hover:bg-orange-500 text-white"
              }`}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCombinationButtons = (
    position: keyof typeof excludedNumbers,
    label: string
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        <span className="font-medium mr-2 sm:mr-4 w-16 sm:w-20 shrink-0 text-right text-sm sm:text-lg">
          {label}
        </span>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {[
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
          ].map((num) => (
            <Button
              key={num}
              onClick={() => toggleExcluded(position, num)}
              className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${
                excludedNumbers[position].has(num)
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-orange-400 hover:bg-orange-500 text-white"
              }`}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-bold">
      {/* 主内容区域，添加底部间距以避免被固定按钮遮挡 */}
      <div className="pt-8 px-4 pb-40 sm:pb-24">
        <div className="max-w-6xl mx-auto">
          {/* 浮动成功提示 */}
          {showFloatingSuccess && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500 text-white px-8 py-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out">
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <span className="text-lg font-semibold">数据生成成功！</span>
              </div>
            </div>
          )}

          <Card className="mb-6">
            <CardHeader
              className="cursor-pointer"
              onClick={() => setIsDataExpanded(!isDataExpanded)}
            >
              <CardTitle className="flex items-center justify-between">
                <span>数据输入区</span>
                <span className="text-sm text-gray-500">
                  {isDataExpanded ? "点击收起" : "点击展开"}
                  {inputData &&
                    ` (已输入${
                      inputData
                        .trim()
                        .split(/\s+/)
                        .filter((num) => /^\d{4}$/.test(num)).length
                    }组数据)`}
                </span>
              </CardTitle>
            </CardHeader>
            {isDataExpanded && (
              <CardContent className="pt-0">
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="请输入四位数字组合，用空格分隔，例如：3853 4564 0637"
                  className="h-32 text-lg resize-none overflow-y-auto"
                />
              </CardContent>
            )}
          </Card>

          {/* 数字排除选择区 */}
          <Card>
            <CardContent className="pt-6 px-3">
              {renderNumberButtons("thousands", "杀千")}
              {renderNumberButtons("hundreds", "杀百")}
              {renderNumberButtons("tens", "杀十")}
              {renderNumberButtons("units", "杀个")}

              {/* 千百、千十、千个等组合 */}
              <div className="space-y-6">
                {renderCombinationButtons("thousandsHundreds", "杀千百")}
                {renderCombinationButtons("thousandsTens", "杀千十")}
                {renderCombinationButtons("thousandsUnits", "杀千个")}
                {renderCombinationButtons("hundredsTens", "杀百十")}
                {renderCombinationButtons("hundredsUnits", "杀百个")}
                {renderCombinationButtons("tensUnits", "杀十个")}
              </div>
            </CardContent>
          </Card>

          {/* 成功提示 */}
          {showSuccess && (
            <Alert className="mt-4 bg-green-100 border-green-400">
              <AlertDescription className="text-green-800">
                数据生成成功！共筛选出 {processedData.length} 组数据。
              </AlertDescription>
            </Alert>
          )}

          {/* 错误提示 */}
          {errorMessage && (
            <Alert className="mt-4 bg-red-100 border-red-400">
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* 固定在底部的功能按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            <Button
              onClick={handleFileImport}
              className={`px-4 sm:px-8 py-3 text-base sm:text-lg transition-colors ${
                importSuccess
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {importSuccess ? `已导入${importedCount}组` : "导入txt数据"}
            </Button>
            <Button
              onClick={generateData}
              disabled={!inputData.trim()}
              className={`px-4 sm:px-8 py-3 text-base sm:text-lg disabled:bg-gray-400 transition-colors ${
                generateSuccess
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {generateSuccess ? "成功生成" : "生成数据"}
            </Button>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button
                  disabled={processedData.length === 0}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-8 py-3 text-base sm:text-lg disabled:bg-gray-400"
                >
                  导出数据
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-96 gap-0 overflow-hidden">
                <DialogTitle className="text-lg font-semibold">
                  数据预览
                </DialogTitle>
                {/* 顶部区域：标题信息和操作按钮在同一水平线 */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        共筛选出 {processedData.length} 组数据
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowPreview(false)}
                        variant="outline"
                      >
                        取消
                      </Button>
                      <Button
                        onClick={exportData}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        确认导出
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 可滚动的数据内容 */}
                <div className="bg-gray-100 p-4 rounded-md max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {processedData.join(" ")}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={resetAll}
              className={`px-4 sm:px-8 py-3 text-base sm:text-lg transition-colors ${
                resetSuccess
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {resetSuccess ? "重置成功" : "重置"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
