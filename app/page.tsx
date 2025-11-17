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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 触感反馈函数
const triggerHapticFeedback = (
  type: "light" | "medium" | "heavy" = "light"
) => {
  // 检查是否支持触感反馈
  if ("vibrate" in navigator) {
    // 根据类型设置不同的震动强度
    switch (type) {
      case "light":
        navigator.vibrate(10); // 轻微震动10ms
        break;
      case "medium":
        navigator.vibrate(25); // 中等震动25ms
        break;
      case "heavy":
        navigator.vibrate(50); // 较强震动50ms
        break;
    }
  }
};

// 自定义移动端友好的Tooltip组件
const MobileTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  className?: string;
}> = ({ children, content, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    triggerHapticFeedback("light");
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      <div
        className={`${className} cursor-help hover:text-blue-600 transition-colors active:scale-95 active:bg-blue-50 rounded-sm`}
        onClick={handleClick}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onBlur={() => setIsOpen(false)}
        onTouchStart={() => triggerHapticFeedback("light")}
        tabIndex={0}
        style={{
          WebkitTapHighlightColor: "rgba(59, 130, 246, 0.1)",
          touchAction: "manipulation",
        }}
      >
        {children}
      </div>

      {isOpen && (
        <div className="absolute bottom-full left-6/7 transform -translate-x-2/7 mb-2 z-50">
          <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg w-44  whitespace-normal leading-relaxed">
            {content}
            <div className="absolute top-full left-2/7 transform -translate-x-15/5 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function LotteryApp() {
  // 使用移动端优化Hook
  useMobileOptimization();

  // 为按钮点击添加触感反馈的包装函数
  const withHapticFeedback = (
    callback: () => void,
    feedbackType: "light" | "medium" | "heavy" = "light"
  ) => {
    return () => {
      triggerHapticFeedback(feedbackType);
      callback();
    };
  };

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
  // 新增：任意位相同的排除
  const [excludeAnyTwoSame, setExcludeAnyTwoSame] = useState<Set<number>>(
    new Set()
  );
  const [excludeAnyThreeSame, setExcludeAnyThreeSame] = useState<Set<number>>(
    new Set()
  );
  // 新增：任意位求和的排除
  const [excludeAnyTwoSum, setExcludeAnyTwoSum] = useState<Set<number>>(
    new Set()
  );
  const [excludeAnyThreeSum, setExcludeAnyThreeSum] = useState<Set<number>>(
    new Set()
  );
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
    setExcludeAnyTwoSame(new Set());
    setExcludeAnyThreeSame(new Set());
    setExcludeAnyTwoSum(new Set());
    setExcludeAnyThreeSum(new Set());
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

  // 工具提示内容映射
  const tooltipTexts = {
    // 连号类型
    去四连: "排除四个位置都是相同数字的组合，如选择'1'则排除1111",
    去三连:
      "排除连续三个位置相同数字的组合，如选择'2'则排除2220、2221、...、0222、1222等",
    去二连:
      "排除连续两个位置相同数字的组合，如选择'3'则排除3310、3311、...、0339、1233等",

    // 任意位相同
    去两同:
      "排除任意两个位置有相同数字的组合，如选择'1'则排除1123、2112、3141等包含两个1的组合",
    去三同:
      "排除任意三个位置有相同数字的组合，如选择'2'则排除2229、2922、2222等包含三个2的组合",

    // 任意位求和
    去两和:
      "排除任意两个位置数字相加等于指定值的组合，如选择'9'则排除1284(1+8=9)、2736(2+7=9)等",
    去三和:
      "排除任意三个位置数字相加等于指定值的组合，如选择'15'则排除1689(1+6+8=15)、2589(2+5+8=15)等",

    // 单个位置
    去千: "排除千位数字为指定值的组合，如选择'1'则排除1000-1999范围的所有组合",
    去百: "排除百位数字为指定值的组合，如选择'2'则排除0200-0299、1200-1299、2200-2299等",
    去十: "排除十位数字为指定值的组合，如选择'3'则排除0030-0039、0130-0139、0230-0239等",
    去个: "排除个位数字为指定值的组合，如选择'4'则排除0004、0014、0024、0034等",

    // 两位组合
    去千百:
      "排除千位+百位数字相加等于指定值的组合，如选择'5'则排除0500、1400、2300、3200、4100、5000等",
    去千十:
      "排除千位+十位数字相加等于指定值的组合，如选择'6'则排除0060、1050、2040、3030、4020、5010、6000等",
    去千个:
      "排除千位+个位数字相加等于指定值的组合，如选择'7'则排除0007、1006、2005、3004、4003、5002、6001、7000等",
    去百十:
      "排除百位+十位数字相加等于指定值的组合，如选择'8'则排除0080、0170、0260、0350、0440、0530、0620、0710、0800等",
    去百个:
      "排除百位+个位数字相加等于指定值的组合，如选择'9'则排除0009、0108、0207、0306、0405、0504、0603、0702、0801、0900等",
    去十个:
      "排除十位+个位数字相加等于指定值的组合，如选择'10'则排除0019、0028、0037、0046、0055、0064、0073、0082、0091等",

    // 三位组合
    去千百十:
      "排除千位+百位+十位数字相加等于指定值的组合，如选择'15'则排除1590、2580、3570、4560、5550等",
    去千百个:
      "排除千位+百位+个位数字相加等于指定值的组合，如选择'12'则排除1209、2208、3207、4206、5205等",
    去千十个:
      "排除千位+十位+个位数字相加等于指定值的组合，如选择'18'则排除1089、2079、3069、4059、5049等",
    去百十个:
      "排除百位+十位+个位数字相加等于指定值的组合，如选择'21'则排除0399、0489、0579、0669、0759等",
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

  // 检查是否有任意两位相同的数字
  const hasAnyTwoSame = (digits: number[], targetDigit: number): boolean => {
    const [thousands, hundreds, tens, units] = digits;
    const positions = [thousands, hundreds, tens, units];
    const count = positions.filter((d) => d === targetDigit).length;
    return count >= 2;
  };

  // 检查是否有任意三位相同的数字
  const hasAnyThreeSame = (digits: number[], targetDigit: number): boolean => {
    const [thousands, hundreds, tens, units] = digits;
    const positions = [thousands, hundreds, tens, units];
    const count = positions.filter((d) => d === targetDigit).length;
    return count >= 3;
  };

  // 检查是否有任意两位求和等于目标值
  const hasAnyTwoSum = (digits: number[], targetSum: number): boolean => {
    const [thousands, hundreds, tens, units] = digits;
    const positions = [thousands, hundreds, tens, units];

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i] + positions[j] === targetSum) {
          return true;
        }
      }
    }
    return false;
  };

  // 检查是否有任意三位求和等于目标值
  const hasAnyThreeSum = (digits: number[], targetSum: number): boolean => {
    const [thousands, hundreds, tens, units] = digits;
    const positions = [thousands, hundreds, tens, units];

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        for (let k = j + 1; k < positions.length; k++) {
          if (positions[i] + positions[j] + positions[k] === targetSum) {
            return true;
          }
        }
      }
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

      // 去任意两位相同：检查是否包含指定数字的任意两位相同
      for (const digit of excludeAnyTwoSame) {
        if (hasAnyTwoSame(digits, digit)) {
          return false;
        }
      }

      // 去任意三位相同：检查是否包含指定数字的任意三位相同
      for (const digit of excludeAnyThreeSame) {
        if (hasAnyThreeSame(digits, digit)) {
          return false;
        }
      }

      // 去任意两位求和：检查是否包含指定求和值的任意两位
      for (const sum of excludeAnyTwoSum) {
        if (hasAnyTwoSum(digits, sum)) {
          return false;
        }
      }

      // 去任意三位求和：检查是否包含指定求和值的任意三位
      for (const sum of excludeAnyThreeSum) {
        if (hasAnyThreeSum(digits, sum)) {
          return false;
        }
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

      // 去任意两位相同：检查是否包含指定数字的任意两位相同
      for (const digit of excludeAnyTwoSame) {
        if (hasAnyTwoSame(digits, digit)) {
          return false;
        }
      }

      // 去任意三位相同：检查是否包含指定数字的任意三位相同
      for (const digit of excludeAnyThreeSame) {
        if (hasAnyThreeSame(digits, digit)) {
          return false;
        }
      }

      // 去任意两位求和：检查是否包含指定求和值的任意两位
      for (const sum of excludeAnyTwoSum) {
        if (hasAnyTwoSum(digits, sum)) {
          return false;
        }
      }

      // 去任意三位求和：检查是否包含指定求和值的任意三位
      for (const sum of excludeAnyThreeSum) {
        if (hasAnyThreeSum(digits, sum)) {
          return false;
        }
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
        <MobileTooltip
          content={tooltipTexts[label as keyof typeof tooltipTexts] || ""}
          className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-sm sm:text-lg"
        >
          <span>{label}</span>
        </MobileTooltip>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={withHapticFeedback(
              () => toggleAllBasic(position, 9),
              "medium"
            )}
            onTouchStart={() => triggerHapticFeedback("light")}
            className={`w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
              [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].every((num) =>
                excludedNumbers[position].has(num)
              )
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-orange-400 hover:bg-orange-500 text-white"
            }`}
            style={{
              WebkitTapHighlightColor: "rgba(239, 68, 68, 0.2)",
              touchAction: "manipulation",
            }}
          >
            全部
          </Button>
          {/* 0-9数字按钮 */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={withHapticFeedback(
                () => toggleExcluded(position, num),
                "light"
              )}
              onTouchStart={() => triggerHapticFeedback("light")}
              className={`w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-semibold transition-all duration-150 active:scale-95 ${
                excludedNumbers[position].has(num)
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-orange-400 hover:bg-orange-500 text-white"
              }`}
              style={{
                WebkitTapHighlightColor: "rgba(239, 68, 68, 0.2)",
                touchAction: "manipulation",
              }}
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
        <MobileTooltip
          content={tooltipTexts[label as keyof typeof tooltipTexts] || ""}
          className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-sm sm:text-lg"
        >
          <span>{label}</span>
        </MobileTooltip>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllBasic(position, 18)}
            className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${
              Array.from({ length: 19 }, (_, i) => i).every((num) =>
                excludedNumbers[position].has(num)
              )
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-orange-400 hover:bg-orange-500 text-white"
            }`}
          >
            全部
          </Button>
          {/* 0-18数字按钮 */}
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
        <MobileTooltip
          content={tooltipTexts[label as keyof typeof tooltipTexts] || ""}
          className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-xs sm:text-base"
        >
          <span>{label}</span>
        </MobileTooltip>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllBasic(position, 27)}
            className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${
              Array.from({ length: 28 }, (_, i) => i).every((num) =>
                excludedNumbers[position].has(num)
              )
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-orange-400 hover:bg-orange-500 text-white"
            }`}
          >
            全部
          </Button>
          {/* 0-27数字按钮 */}
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

  // 新增：控制基础排除的"全部"按钮
  const toggleAllBasic = (
    position: keyof typeof excludedNumbers,
    maxValue: number
  ) => {
    const allValues = new Set(
      Array.from({ length: maxValue + 1 }, (_, i) => i)
    );
    const currentSet = excludedNumbers[position];
    const isAllSelected = [...allValues].every((value) =>
      currentSet.has(value)
    );

    setExcludedNumbers((prev) => ({
      ...prev,
      [position]: isAllSelected ? new Set() : allValues,
    }));
  };

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
        <MobileTooltip
          content={tooltipTexts[label as keyof typeof tooltipTexts] || ""}
          className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-sm sm:text-lg"
        >
          <span>{label}</span>
        </MobileTooltip>
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

  // 新增：控制任意位相同和求和的函数
  const toggleAnyDigit = (
    type: "anyTwoSame" | "anyThreeSame" | "anyTwoSum" | "anyThreeSum",
    value: number
  ) => {
    if (type === "anyTwoSame") {
      const newSet = new Set(excludeAnyTwoSame);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      setExcludeAnyTwoSame(newSet);
    } else if (type === "anyThreeSame") {
      const newSet = new Set(excludeAnyThreeSame);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      setExcludeAnyThreeSame(newSet);
    } else if (type === "anyTwoSum") {
      const newSet = new Set(excludeAnyTwoSum);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      setExcludeAnyTwoSum(newSet);
    } else if (type === "anyThreeSum") {
      const newSet = new Set(excludeAnyThreeSum);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      setExcludeAnyThreeSum(newSet);
    }
  };

  // 切换全部任意位的排除状态
  const toggleAllAny = (
    type: "anyTwoSame" | "anyThreeSame" | "anyTwoSum" | "anyThreeSum"
  ) => {
    if (type === "anyTwoSame") {
      const allDigits = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const isAllSelected = [...allDigits].every((digit) =>
        excludeAnyTwoSame.has(digit)
      );
      setExcludeAnyTwoSame(isAllSelected ? new Set() : allDigits);
    } else if (type === "anyThreeSame") {
      const allDigits = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const isAllSelected = [...allDigits].every((digit) =>
        excludeAnyThreeSame.has(digit)
      );
      setExcludeAnyThreeSame(isAllSelected ? new Set() : allDigits);
    } else if (type === "anyTwoSum") {
      const allSums = new Set(Array.from({ length: 19 }, (_, i) => i)); // 0-18
      const isAllSelected = [...allSums].every((sum) =>
        excludeAnyTwoSum.has(sum)
      );
      setExcludeAnyTwoSum(isAllSelected ? new Set() : allSums);
    } else if (type === "anyThreeSum") {
      const allSums = new Set(Array.from({ length: 28 }, (_, i) => i)); // 0-27
      const isAllSelected = [...allSums].every((sum) =>
        excludeAnyThreeSum.has(sum)
      );
      setExcludeAnyThreeSum(isAllSelected ? new Set() : allSums);
    }
  };

  // 渲染任意位相同按钮 (0-9数字)
  const renderAnySameButtons = (
    type: "anyTwoSame" | "anyThreeSame",
    label: string,
    excludedSet: Set<number>
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        <MobileTooltip
          content={tooltipTexts[label as keyof typeof tooltipTexts] || ""}
          className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-sm sm:text-lg"
        >
          <span>{label}</span>
        </MobileTooltip>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllAny(type)}
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
              onClick={() => toggleAnyDigit(type, digit)}
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

  // 渲染任意位求和按钮
  const renderAnySumButtons = (
    type: "anyTwoSum" | "anyThreeSum",
    label: string,
    excludedSet: Set<number>,
    maxValue: number
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        <MobileTooltip
          content={tooltipTexts[label as keyof typeof tooltipTexts] || ""}
          className="font-medium leading-10 mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 text-right text-sm sm:text-lg"
        >
          <span>{label}</span>
        </MobileTooltip>
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllAny(type)}
            className={`size-8 sm:size-12 text-xs sm:text-sm font-semibold transition-colors ${
              [...Array(maxValue + 1)].every((_, i) => excludedSet.has(i))
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-orange-400 hover:bg-orange-500 text-white"
            }`}
          >
            全部
          </Button>
          {/* 数字按钮 */}
          {Array.from({ length: maxValue + 1 }, (_, i) => i).map((sum) => (
            <Button
              key={sum}
              onClick={() => toggleAnyDigit(type, sum)}
              className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${
                excludedSet.has(sum)
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-orange-400 hover:bg-orange-500 text-white"
              }`}
            >
              {sum}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <GlobalMobileStyles />
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 font-bold">
          {/* 主内容区域，添加底部间距以避免被固定按钮遮挡 */}
          <div className="pt-4 px-2 pb-40 sm:pb-10 sm:px-5">
            <div className="max-w-308 mx-auto">
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
                    <span className="text-lg font-semibold">
                      {floatingMessage}
                    </span>
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
                    "去四连",
                    excludeFourSameNumbers
                  )}
                  {renderConsecutiveButtons(
                    "three",
                    "去三连",
                    excludeThreeConsecutiveSameNumbers
                  )}
                  {renderConsecutiveButtons(
                    "two",
                    "去二连",
                    excludeTwoConsecutiveSameNumbers
                  )}

                  <Separator className="my-4" />

                  {/* 新增：任意位相同 */}
                  {renderAnySameButtons(
                    "anyThreeSame",
                    "去三同",
                    excludeAnyThreeSame
                  )}
                  {renderAnySameButtons(
                    "anyTwoSame",
                    "去两同",
                    excludeAnyTwoSame
                  )}

                  <Separator className="my-4" />

                  {/* 新增：任意位求和 */}
                  {renderAnySumButtons(
                    "anyThreeSum",
                    "去三和",
                    excludeAnyThreeSum,
                    27
                  )}
                  {renderAnySumButtons(
                    "anyTwoSum",
                    "去两和",
                    excludeAnyTwoSum,
                    18
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
                    {renderThreeDigitSumButtons(
                      "thousandsTensUnits",
                      "去千十个"
                    )}
                    {renderThreeDigitSumButtons(
                      "hundredsTensUnits",
                      "去百十个"
                    )}
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
                  预览筛选
                  {inputData.trim() && ` (${calculateFilteredCount()}组)`}
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
      </TooltipProvider>
    </>
  );
}

// 全局样式组件，为移动端触感反馈优化
const GlobalMobileStyles = () => (
  <style jsx global>{`
    /* 移动端按钮触感反馈优化 */
    button {
      -webkit-tap-highlight-color: rgba(59, 130, 246, 0.2);
      touch-action: manipulation;
      transform-origin: center;
      transition: all 0.15s ease;
    }

    /* 按下时的缩放效果 */
    button:active {
      transform: scale(0.95);
    }

    /* 移动端禁用双击缩放 */
    @media (max-width: 768px) {
      * {
        touch-action: manipulation;
      }
    }

    /* 移动端按钮高亮颜色 */
    .btn-primary {
      -webkit-tap-highlight-color: rgba(239, 68, 68, 0.2);
    }

    .btn-secondary {
      -webkit-tap-highlight-color: rgba(251, 146, 60, 0.2);
    }
  `}</style>
);

// 自定义Hook：为组件添加触感反馈
export const useMobileOptimization = () => {
  React.useEffect(() => {
    // 为所有按钮添加触感反馈
    const addHapticToButtons = () => {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((button) => {
        // 添加触摸开始事件
        button.addEventListener(
          "touchstart",
          () => {
            triggerHapticFeedback("light");
          },
          { passive: true }
        );

        // 添加点击事件的触感反馈
        const originalClick = button.onclick;
        button.onclick = (e) => {
          triggerHapticFeedback("medium");
          if (originalClick) {
            originalClick.call(button, e);
          }
        };
      });
    };

    // 延迟执行以确保组件已渲染
    setTimeout(addHapticToButtons, 100);

    // 监听DOM变化，为动态添加的按钮也添加触感反馈
    const observer = new MutationObserver(addHapticToButtons);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);
};
