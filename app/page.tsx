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
import { Separator } from "@/components/ui/separator";

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
    // 三位数之和
    thousandsHundredsTens: new Set<number>(),
    thousandsHundredsUnits: new Set<number>(),
    thousandsTensUnits: new Set<number>(),
    hundredsTensUnits: new Set<number>(),
  });
  // 去连号类别状态 - 存储要排除的连号数字
  const [excludeFourSameNumbers, setExcludeFourSameNumbers] = useState<
    Set<number>
  >(new Set());
  const [
    excludeThreeConsecutiveSameNumbers,
    setExcludeThreeConsecutiveSameNumbers,
  ] = useState<Set<number>>(new Set());
  const [
    excludeTwoConsecutiveSameNumbers,
    setExcludeTwoConsecutiveSameNumbers,
  ] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDataExpanded, setIsDataExpanded] = useState(true);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showFloatingSuccess, setShowFloatingSuccess] = useState(false);
  const [floatingMessage, setFloatingMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 显示浮动成功提示
  const showSuccessMessage = (message: string) => {
    setFloatingMessage(message);
    setShowFloatingSuccess(true);
    setTimeout(() => setShowFloatingSuccess(false), 1000);
  };

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
          // 确保输入框保持展开状态
          setIsDataExpanded(true);

          // 显示浮动成功提示
          showSuccessMessage("导入成功！");

          // 清空文件输入值，允许重复选择同一文件
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        };
        reader.readAsText(file);
      } else {
        setErrorMessage("请选择txt格式的文件");
        setTimeout(() => setErrorMessage(""), 3000);
        // 清空文件输入值
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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
      // 三位数之和
      thousandsHundredsTens: new Set<number>(),
      thousandsHundredsUnits: new Set<number>(),
      thousandsTensUnits: new Set<number>(),
      hundredsTensUnits: new Set<number>(),
    });
    setExcludeFourSameNumbers(new Set());
    setExcludeThreeConsecutiveSameNumbers(new Set());
    setExcludeTwoConsecutiveSameNumbers(new Set());
    setErrorMessage("");
    setImportSuccess(false);
    setImportedCount(0);
    setResetSuccess(true);
    setIsDataExpanded(true);

    // 显示浮动成功提示
    showSuccessMessage("重置成功！");

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

  // 复制数据到剪贴板
  const copyData = async () => {
    try {
      const dataStr = processedData.join(" ");
      await navigator.clipboard.writeText(dataStr);
      // 确保对话框不会干扰提示
      setTimeout(() => {
        showSuccessMessage("复制成功！");
      }, 100);
    } catch (err) {
      console.error("复制失败:", err);
      setErrorMessage("复制失败，请手动复制");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  // 生成一万组数据（0000-9999的所有组合）
  const generateAllData = () => {
    const allNumbers: string[] = [];
    for (let i = 0; i <= 9999; i++) {
      // 将数字格式化为四位数字符串，不足四位前面补0
      allNumbers.push(i.toString().padStart(4, "0"));
    }
    const dataStr = allNumbers.join(" ");
    setInputData(dataStr);
    setImportedCount(10000);
    setImportSuccess(true);
    // 确保输入框保持展开状态
    setIsDataExpanded(true);

    // 显示浮动成功提示
    showSuccessMessage("生成成功！");
  };

  // 检查是否包含特定数字的连号
  const hasConsecutiveSameDigit = (
    digits: number[],
    targetDigit: number,
    count: number
  ): boolean => {
    if (count === 4) {
      return digits.every((d) => d === targetDigit);
    } else if (count === 3) {
      const [thousands, hundreds, tens, units] = digits;
      return (
        (thousands === targetDigit &&
          hundreds === targetDigit &&
          tens === targetDigit) ||
        (hundreds === targetDigit &&
          tens === targetDigit &&
          units === targetDigit)
      );
    } else if (count === 2) {
      const [thousands, hundreds, tens, units] = digits;
      return (
        (thousands === targetDigit && hundreds === targetDigit) ||
        (hundreds === targetDigit && tens === targetDigit) ||
        (tens === targetDigit && units === targetDigit)
      );
    }
    return false;
  };

  // 实时计算筛选后的组数
  const calculateFilteredCount = () => {
    if (!inputData.trim()) return 0;

    const numbers = inputData
      .trim()
      .split(/\s+/)
      .filter((num) => /^\d{4}$/.test(num));

    if (numbers.length === 0) return 0;

    const filtered = numbers.filter((num) => {
      const digits = num.split("").map(Number);
      const [thousands, hundreds, tens, units] = digits;

      // 去四连号：检查是否包含指定数字的四连号
      for (const digit of excludeFourSameNumbers) {
        if (hasConsecutiveSameDigit(digits, digit, 4)) {
          return false;
        }
      }

      // 去三连号：检查是否包含指定数字的三连号
      for (const digit of excludeThreeConsecutiveSameNumbers) {
        if (hasConsecutiveSameDigit(digits, digit, 3)) {
          return false;
        }
      }

      // 去二连号：检查是否包含指定数字的二连号
      for (const digit of excludeTwoConsecutiveSameNumbers) {
        if (hasConsecutiveSameDigit(digits, digit, 2)) {
          return false;
        }
      }

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

      // 检查组合位置的排除（三位数字之和）
      const thousandsHundredsTens = thousands + hundreds + tens;
      const thousandsHundredsUnits = thousands + hundreds + units;
      const thousandsTensUnits = thousands + tens + units;
      const hundredsTensUnits = hundreds + tens + units;

      if (
        excludedNumbers.thousandsHundredsTens.has(thousandsHundredsTens) ||
        excludedNumbers.thousandsHundredsUnits.has(thousandsHundredsUnits) ||
        excludedNumbers.thousandsTensUnits.has(thousandsTensUnits) ||
        excludedNumbers.hundredsTensUnits.has(hundredsTensUnits)
      ) {
        return false;
      }

      return true;
    });

    return filtered.length;
  };

  // 生成并预览数据
  const generateAndPreview = () => {
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

      // 去四连号：检查是否包含指定数字的四连号
      for (const digit of excludeFourSameNumbers) {
        if (hasConsecutiveSameDigit(digits, digit, 4)) {
          return false;
        }
      }

      // 去三连号：检查是否包含指定数字的三连号
      for (const digit of excludeThreeConsecutiveSameNumbers) {
        if (hasConsecutiveSameDigit(digits, digit, 3)) {
          return false;
        }
      }

      // 去二连号：检查是否包含指定数字的二连号
      for (const digit of excludeTwoConsecutiveSameNumbers) {
        if (hasConsecutiveSameDigit(digits, digit, 2)) {
          return false;
        }
      }

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

      // 检查组合位置的排除（三位数字之和）
      const thousandsHundredsTens = thousands + hundreds + tens;
      const thousandsHundredsUnits = thousands + hundreds + units;
      const thousandsTensUnits = thousands + tens + units;
      const hundredsTensUnits = hundreds + tens + units;

      if (
        excludedNumbers.thousandsHundredsTens.has(thousandsHundredsTens) ||
        excludedNumbers.thousandsHundredsUnits.has(thousandsHundredsUnits) ||
        excludedNumbers.thousandsTensUnits.has(thousandsTensUnits) ||
        excludedNumbers.hundredsTensUnits.has(hundredsTensUnits)
      ) {
        return false;
      }

      return true;
    });

    setProcessedData(filtered);
    setErrorMessage("");
    // 直接显示预览窗口
    setShowPreview(true);
  };

  const renderNumberButtons = (
    position: keyof typeof excludedNumbers,
    label: string
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        <span className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-sm sm:text-lg">
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
        <span className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-sm sm:text-lg">
          {label}
        </span>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {[
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
          ].map((num) => (
            <Button
              key={num}
              onClick={() => toggleExcluded(position, num)}
              className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-lg font-semibold transition-colors ${
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

  const renderThreeDigitSumButtons = (
    position: keyof typeof excludedNumbers,
    label: string
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        <span className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-xs sm:text-base">
          {label}
        </span>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {Array.from({ length: 28 }, (_, i) => i).map((num) => (
            <Button
              key={num}
              onClick={() => toggleExcluded(position, num)}
              className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-lg font-semibold transition-colors ${
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

  // 切换连号数字的排除状态
  const toggleConsecutiveDigit = (
    type: "four" | "three" | "two",
    digit: number
  ) => {
    if (type === "four") {
      const newSet = new Set(excludeFourSameNumbers);
      if (newSet.has(digit)) {
        newSet.delete(digit);
      } else {
        newSet.add(digit);
      }
      setExcludeFourSameNumbers(newSet);
    } else if (type === "three") {
      const newSet = new Set(excludeThreeConsecutiveSameNumbers);
      if (newSet.has(digit)) {
        newSet.delete(digit);
      } else {
        newSet.add(digit);
      }
      setExcludeThreeConsecutiveSameNumbers(newSet);
    } else if (type === "two") {
      const newSet = new Set(excludeTwoConsecutiveSameNumbers);
      if (newSet.has(digit)) {
        newSet.delete(digit);
      } else {
        newSet.add(digit);
      }
      setExcludeTwoConsecutiveSameNumbers(newSet);
    }
  };

  // 切换全部连号的排除状态
  const toggleAllConsecutive = (type: "four" | "three" | "two") => {
    const allDigits = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    if (type === "four") {
      const isAllSelected = [...allDigits].every((digit) =>
        excludeFourSameNumbers.has(digit)
      );
      setExcludeFourSameNumbers(isAllSelected ? new Set() : allDigits);
    } else if (type === "three") {
      const isAllSelected = [...allDigits].every((digit) =>
        excludeThreeConsecutiveSameNumbers.has(digit)
      );
      setExcludeThreeConsecutiveSameNumbers(
        isAllSelected ? new Set() : allDigits
      );
    } else if (type === "two") {
      const isAllSelected = [...allDigits].every((digit) =>
        excludeTwoConsecutiveSameNumbers.has(digit)
      );
      setExcludeTwoConsecutiveSameNumbers(
        isAllSelected ? new Set() : allDigits
      );
    }
  };

  // 渲染连号选择按钮
  const renderConsecutiveButtons = (
    type: "four" | "three" | "two",
    label: string,
    excludedSet: Set<number>
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        <span className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-xs sm:text-sm">
          {label}
        </span>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllConsecutive(type)}
            className={`w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${
              [...Array(10)].every((_, i) => excludedSet.has(i))
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-orange-400 hover:bg-orange-500 text-white"
            }`}
          >
            全部
          </Button>
          {/* 0-9数字按钮 */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              onClick={() => toggleConsecutiveDigit(type, digit)}
              className={`w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-semibold transition-colors ${
                excludedSet.has(digit)
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-orange-400 hover:bg-orange-500 text-white"
              }`}
            >
              {digit}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-bold">
      {/* 主内容区域，添加底部间距以避免被固定按钮遮挡 */}
      <div className="pt-4 px-2 pb-40 sm:pb-10 sm:px-5">
        <div className="max-w-296 mx-auto">
          {/* 浮动成功提示 */}
          {showFloatingSuccess && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-9999 bg-green-500 text-white px-8 py-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out">
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
                <span className="text-lg font-semibold">{floatingMessage}</span>
              </div>
            </div>
          )}

          <Card className="mb-4">
            <CardHeader
              className="cursor-pointer pb-0"
              onClick={() => setIsDataExpanded(!isDataExpanded)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>数据输入</span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation(); // 防止触发折叠/展开
                      generateAllData();
                    }}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 mr-4"
                  >
                    生成一万组
                  </Button>
                </div>
                <span className="text-sm text-gray-500 min-w-0 shrink">
                  <span className="block">
                    {isDataExpanded ? "点击收起" : "点击展开"}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            {isDataExpanded && (
              <CardContent className="pt-0">
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="点击<生成一万组>按钮,或者手动输入四位数字组合，用空格分隔，例如：3853 4564 0637.或者点击<导入txt数据>"
                  className="whitespace-pre-wrap h-32 text-sm resize-none overflow-y-auto"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  }}
                />
              </CardContent>
            )}
          </Card>

          {/* 数字排除选择区 */}
          <Card className="mb-3">
            <CardContent className="pt-0 pb-0 px-1 sm:px-4">
              {/* 去连号类别 */}
              {renderConsecutiveButtons(
                "four",
                "去四连号",
                excludeFourSameNumbers
              )}
              {renderConsecutiveButtons(
                "three",
                "去三连号",
                excludeThreeConsecutiveSameNumbers
              )}
              {renderConsecutiveButtons(
                "two",
                "去二连号",
                excludeTwoConsecutiveSameNumbers
              )}

              <Separator className="my-4" />
              {renderNumberButtons("thousands", "去千")}
              {renderNumberButtons("hundreds", "去百")}
              {renderNumberButtons("tens", "去十")}
              {renderNumberButtons("units", "去个")}
              <Separator className="my-4" />

              {/* 千百、千十、千个等组合 */}
              <div className="space-y-6">
                {renderCombinationButtons("thousandsHundreds", "去千百")}
                {renderCombinationButtons("thousandsTens", "去千十")}
                {renderCombinationButtons("thousandsUnits", "去千个")}
                {renderCombinationButtons("hundredsTens", "去百十")}
                {renderCombinationButtons("hundredsUnits", "去百个")}
                {renderCombinationButtons("tensUnits", "去十个")}
              </div>

              <Separator className="my-4" />

              {/* 三位数之和组合 */}
              <div className="space-y-6">
                {renderThreeDigitSumButtons(
                  "thousandsHundredsTens",
                  "去千百十"
                )}
                {renderThreeDigitSumButtons(
                  "thousandsHundredsUnits",
                  "去千百个"
                )}
                {renderThreeDigitSumButtons("thousandsTensUnits", "去千十个")}
                {renderThreeDigitSumButtons("hundredsTensUnits", "去百十个")}
              </div>
            </CardContent>
          </Card>

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
              onClick={generateAndPreview}
              disabled={!inputData.trim()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-8 py-3 text-base sm:text-lg disabled:bg-gray-400"
            >
              预览筛选{inputData.trim() && ` (${calculateFilteredCount()}组)`}
            </Button>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
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
                        onClick={copyData}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        复制
                      </Button>
                      <Button
                        onClick={exportData}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        导出
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
