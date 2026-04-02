"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import useMobileOptimization, { triggerHapticFeedback } from "@/app/hooks/useMobileOptimization";

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
  const [excludeAnyFourSum, setExcludeAnyFourSum] = useState<Set<number>>(
    new Set()
  );
  // 新增：邻号对排除。index 0=>01, 1=>12, ..., 8=>89, 9=>90
  const [excludeAdjacentPairs, setExcludeAdjacentPairs] = useState<Set<number>>(
    new Set()
  );
  // 新增：不定位两码。分为‘必含’和‘杀号’。
  const [keepTwoCodes, setKeepTwoCodes] = useState<Set<string>>(new Set());
  const [killTwoCodes, setKillTwoCodes] = useState<Set<string>>(new Set());
  // 筛选模式状态：'exclude' 为去除（默认），'keep' 为留下
  const [filterModes, setFilterModes] = useState<Record<string, "exclude" | "keep">>({});

  // 切换筛选模式
  const toggleFilterMode = (key: string) => {
    setFilterModes((prev) => ({
      ...prev,
      [key]: prev[key] === "keep" ? "exclude" : "keep",
    }));
    triggerHapticFeedback("medium");
  };

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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      const validFiles = fileList.filter(
        (file) => file.type === "text/plain" || file.name.endsWith(".txt")
      );

      if (validFiles.length === 0) {
        setErrorMessage("请选择txt格式的文件");
        setTimeout(() => setErrorMessage(""), 3000);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      try {
        const fileContents = await Promise.all(
          validFiles.map((file) => {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.onerror = (e) => reject(e);
              reader.readAsText(file);
            });
          })
        );

        // 解析每个文件的号码
        const fileNumbers = fileContents.map((content) => {
          return content
            .trim()
            .split(/\s+/)
            .filter((num) => /^\d{4}$/.test(num));
        });

        let finalNumbers: string[] = [];

        if (fileNumbers.length === 1) {
          // 单个文件，直接使用
          finalNumbers = fileNumbers[0];
        } else if (fileNumbers.length > 1) {
          // 多个文件，取交集（只保留在所有文件中都出现的号码）
          // 先对每个文件的号码列表去重，方便计算交集
          const fileSets = fileNumbers.map((nums) => new Set(nums));

          // 从第一个文件的集合开始
          const intersection = new Set<string>();

          // 遍历第一个文件的每一个唯一号码
          for (const num of fileSets[0]) {
            // 检查这个号码是否在所有其它文件的集合中都存在
            if (fileSets.every(set => set.has(num))) {
              intersection.add(num);
            }
          }

          finalNumbers = Array.from(intersection);
        }

        const combinedContent = finalNumbers.join(" ");
        setInputData(combinedContent);
        setErrorMessage("");

        setImportedCount(finalNumbers.length);
        setImportSuccess(true);
        // 确保输入框保持展开状态
        setIsDataExpanded(true);

        // 根据文件数量显示不同的成功提示
        if (validFiles.length > 1) {
          showSuccessMessage(`成功导入 ${validFiles.length} 个文件并提取交集！`);
        } else {
          showSuccessMessage(`成功导入 ${validFiles.length} 个文件！`);
        }

        // 清空文件输入值，允许重复选择同一文件
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("读取文件失败:", error);
        setErrorMessage("读取文件失败，请重试");
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
    setExcludeAnyFourSum(new Set());
    setExcludeAdjacentPairs(new Set());
    setKeepTwoCodes(new Set());
    setKillTwoCodes(new Set());
    setFilterModes({});
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
    去邻号:
      "排除任意位置包含指定邻号数字的组合。如选择'12'则排除包含1和2的组合（含隔位或相连），例如1002、1200、2001、2100等。",

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
    去四和:
      "排除四个位置数字相加等于指定值的组合，如选择'15'则排除1239(1+2+3+9=15)、1356(1+3+5+6=15)等",
    不定位两码:
      "只要选中的两个数字在组合中同时出现，即判定为匹配。例如选中'34'，则所有包含3和4的组合（如1345, 3489, 4032等）都将被匹配。对于'33'此类翻倍号，则要求数字3在组合中至少出现两次。",

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

  // 检查是否有任意四位求和等于目标值
  const hasAnyFourSum = (digits: number[], targetSum: number): boolean => {
    const [thousands, hundreds, tens, units] = digits;
    return thousands + hundreds + tens + units === targetSum;
  };

  // 邻号对定义：index 0=>01, 1=>12, ..., 8=>89, 9=>90
  const ADJACENT_PAIRS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
    [5, 6], [6, 7], [7, 8], [8, 9], [9, 0],
  ];

  // 检查四位数是否在任意位置包含指定的两个邻号数字（哪怕隔开也可以）
  const hasAdjacentPair = (digits: number[], pairIndex: number): boolean => {
    const [a, b] = ADJACENT_PAIRS[pairIndex];
    const hasA = digits.includes(a);
    const hasB = digits.includes(b);
    return hasA && hasB;
  };

  // 检查四位数是否包含特定的两码（不定位）
  const hasUnfixedTwoCode = (digits: number[], pairStr: string): boolean => {
    const a = parseInt(pairStr[0]);
    const b = parseInt(pairStr[1]);

    if (a === b) {
      // 豹子号/对子号逻辑：在该数字中 A 必须至少出现两次
      return digits.filter((d) => d === a).length >= 2;
    } else {
      // 普通两码：A 和 B 都要出现
      return digits.includes(a) && digits.includes(b);
    }
  };

  // 核心筛选逻辑：判断一个号码是否应该保留
  const shouldKeepNumber = (num: string): boolean => {
    const digits = num.split("").map(Number);
    const [thousands, hundreds, tens, units] = digits;

    // 辅助函数：根据模式判断规则
    const checkRule = (
      key: string,
      set: Set<number> | Set<string>,
      isMatch: boolean
    ): boolean => {
      if (set.size === 0) return true;
      const mode = filterModes[key] || "exclude";
      return mode === "exclude" ? !isMatch : isMatch;
    };

    // 1. 去/留 连号
    const hasFourMatch = Array.from(excludeFourSameNumbers).some((d) =>
      hasConsecutiveSameDigit(digits, d, 4)
    );
    if (!checkRule("four", excludeFourSameNumbers, hasFourMatch)) return false;

    const hasThreeMatch = Array.from(excludeThreeConsecutiveSameNumbers).some(
      (d) => hasConsecutiveSameDigit(digits, d, 3)
    );
    if (!checkRule("three", excludeThreeConsecutiveSameNumbers, hasThreeMatch))
      return false;

    const hasTwoMatch = Array.from(excludeTwoConsecutiveSameNumbers).some((d) =>
      hasConsecutiveSameDigit(digits, d, 2)
    );
    if (!checkRule("two", excludeTwoConsecutiveSameNumbers, hasTwoMatch))
      return false;

    // 1b. 去/留 邻号
    if (excludeAdjacentPairs.size > 0) {
      const hasAdjMatch = Array.from(excludeAdjacentPairs).some((pairIdx) =>
        hasAdjacentPair(digits, pairIdx)
      );
      if (!checkRule("adjacentPairs", excludeAdjacentPairs, hasAdjMatch))
        return false;
    }

    // 1c. 不定位两码
    // 逻辑：号码必须包含选中的‘必含’两码中的【至少一个】 (OR 逻辑)
    if (keepTwoCodes.size > 0) {
      const anyKeepMatch = Array.from(keepTwoCodes).some((pairStr) =>
        hasUnfixedTwoCode(digits, pairStr)
      );
      if (!anyKeepMatch) return false;
    }

    // 逻辑：号码不能包含任何选中的‘杀号’两码 (OR 逻辑)
    if (killTwoCodes.size > 0) {
      const anyKillMatch = Array.from(killTwoCodes).some((pairStr) =>
        hasUnfixedTwoCode(digits, pairStr)
      );
      if (anyKillMatch) return false;
    }

    // 2. 去/留 任意位相同
    const hasAnyThreeSameMatch = Array.from(excludeAnyThreeSame).some((d) =>
      hasAnyThreeSame(digits, d)
    );
    if (!checkRule("anyThreeSame", excludeAnyThreeSame, hasAnyThreeSameMatch))
      return false;

    const hasAnyTwoSameMatch = Array.from(excludeAnyTwoSame).some((d) =>
      hasAnyTwoSame(digits, d)
    );
    if (!checkRule("anyTwoSame", excludeAnyTwoSame, hasAnyTwoSameMatch))
      return false;

    // 3. 去/留 任意位求和
    const hasAnyFourSumMatch = Array.from(excludeAnyFourSum).some((s) =>
      hasAnyFourSum(digits, s)
    );
    if (!checkRule("anyFourSum", excludeAnyFourSum, hasAnyFourSumMatch))
      return false;

    const hasAnyThreeSumMatch = Array.from(excludeAnyThreeSum).some((s) =>
      hasAnyThreeSum(digits, s)
    );
    if (!checkRule("anyThreeSum", excludeAnyThreeSum, hasAnyThreeSumMatch))
      return false;

    const hasAnyTwoSumMatch = Array.from(excludeAnyTwoSum).some((s) =>
      hasAnyTwoSum(digits, s)
    );
    if (!checkRule("anyTwoSum", excludeAnyTwoSum, hasAnyTwoSumMatch))
      return false;

    // 4. 去/留 单个位置
    if (
      !checkRule(
        "thousands",
        excludedNumbers.thousands,
        excludedNumbers.thousands.has(thousands)
      )
    )
      return false;
    if (
      !checkRule(
        "hundreds",
        excludedNumbers.hundreds,
        excludedNumbers.hundreds.has(hundreds)
      )
    )
      return false;
    if (
      !checkRule("tens", excludedNumbers.tens, excludedNumbers.tens.has(tens))
    )
      return false;
    if (
      !checkRule("units", excludedNumbers.units, excludedNumbers.units.has(units))
    )
      return false;

    // 5. 去/留 组合位置（两位）
    if (
      !checkRule(
        "thousandsHundreds",
        excludedNumbers.thousandsHundreds,
        excludedNumbers.thousandsHundreds.has(thousands + hundreds)
      )
    )
      return false;
    if (
      !checkRule(
        "thousandsTens",
        excludedNumbers.thousandsTens,
        excludedNumbers.thousandsTens.has(thousands + tens)
      )
    )
      return false;
    if (
      !checkRule(
        "thousandsUnits",
        excludedNumbers.thousandsUnits,
        excludedNumbers.thousandsUnits.has(thousands + units)
      )
    )
      return false;
    if (
      !checkRule(
        "hundredsTens",
        excludedNumbers.hundredsTens,
        excludedNumbers.hundredsTens.has(hundreds + tens)
      )
    )
      return false;
    if (
      !checkRule(
        "hundredsUnits",
        excludedNumbers.hundredsUnits,
        excludedNumbers.hundredsUnits.has(hundreds + units)
      )
    )
      return false;
    if (
      !checkRule(
        "tensUnits",
        excludedNumbers.tensUnits,
        excludedNumbers.tensUnits.has(tens + units)
      )
    )
      return false;

    // 6. 去/留 组合位置（三位）
    if (
      !checkRule(
        "thousandsHundredsTens",
        excludedNumbers.thousandsHundredsTens,
        excludedNumbers.thousandsHundredsTens.has(thousands + hundreds + tens)
      )
    )
      return false;
    if (
      !checkRule(
        "thousandsHundredsUnits",
        excludedNumbers.thousandsHundredsUnits,
        excludedNumbers.thousandsHundredsUnits.has(thousands + hundreds + units)
      )
    )
      return false;
    if (
      !checkRule(
        "thousandsTensUnits",
        excludedNumbers.thousandsTensUnits,
        excludedNumbers.thousandsTensUnits.has(thousands + tens + units)
      )
    )
      return false;
    if (
      !checkRule(
        "hundredsTensUnits",
        excludedNumbers.hundredsTensUnits,
        excludedNumbers.hundredsTensUnits.has(hundreds + tens + units)
      )
    )
      return false;

    return true;
  };

  // 实时计算筛选后的组数
  const calculateFilteredCount = () => {
    if (!inputData.trim()) return 0;

    const numbers = inputData
      .trim()
      .split(/\s+/)
      .filter((num) => /^\d{4}$/.test(num));

    if (numbers.length === 0) return 0;

    const filtered = numbers.filter(shouldKeepNumber);

    // 去重
    const uniqueFiltered = Array.from(new Set(filtered));
    return uniqueFiltered.length;
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

    const filtered = numbers.filter(shouldKeepNumber);

    // 去重
    const uniqueFiltered = Array.from(new Set(filtered));
    setProcessedData(uniqueFiltered);
    setErrorMessage("");
    // 直接显示预览窗口
    setShowPreview(true);
  };

  // 渲染规则案卷头（包含去/留切换按钮）
  const renderRuleHeader = (key: string, label: string) => {
    const mode = filterModes[key] || "exclude";
    const isKeep = mode === "keep";
    const displayLabel = label.replace(/^(去|留)/, "");

    return (
      <div className="flex flex-col items-center mr-2 sm:mr-4 w-12 sm:w-16 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleFilterMode(key as string)}
          className={`h-7 px-1 text-[10px] sm:text-xs mb-1 font-bold ${isKeep
            ? "bg-green-500 text-white hover:bg-green-600 border-green-600 shadow-sm"
            : "bg-red-500 text-white hover:bg-red-600 border-red-600 shadow-sm"
            } transition-all duration-200 rounded-md active:scale-95`}
        >
          {isKeep ? "留下" : "去除"}
        </Button>
        <MobileTooltip
          content={tooltipTexts[label as keyof typeof tooltipTexts] || ""}
          className="font-medium text-center text-sm sm:text-lg leading-tight text-gray-700"
        >
          <span>{displayLabel}</span>
        </MobileTooltip>
      </div>
    );
  };

  const renderNumberButtons = (
    position: keyof typeof excludedNumbers,
    label: string
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        {renderRuleHeader(position, label)}
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={withHapticFeedback(
              () => toggleAllBasic(position, 9),
              "medium"
            )}
            onTouchStart={() => triggerHapticFeedback("light")}
            className={`w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].every((num) =>
              excludedNumbers[position].has(num)
            )
              ? (filterModes[position] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
              : "bg-orange-400 hover:bg-orange-500 text-white"
              }`}
            style={{
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
              className={`w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-semibold transition-all duration-150 active:scale-95 ${excludedNumbers[position].has(num)
                ? (filterModes[position] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
                : "bg-orange-400 hover:bg-orange-500 text-white"
                }`}
              style={{
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
        {renderRuleHeader(position, label)}
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllBasic(position, 18)}
            className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${Array.from({ length: 19 }, (_, i) => i).every((num) =>
              excludedNumbers[position].has(num)
            )
              ? (filterModes[position] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
              className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-lg font-semibold transition-colors ${excludedNumbers[position].has(num)
                ? (filterModes[position] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
        {renderRuleHeader(position, label)}
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllBasic(position, 27)}
            className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${Array.from({ length: 28 }, (_, i) => i).every((num) =>
              excludedNumbers[position].has(num)
            )
              ? (filterModes[position] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
              className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-lg font-semibold transition-colors ${excludedNumbers[position].has(num)
                ? (filterModes[position] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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

  // 切换单个邻号对的状态
  const toggleAdjacentPair = (pairIndex: number) => {
    setExcludeAdjacentPairs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pairIndex)) {
        newSet.delete(pairIndex);
      } else {
        newSet.add(pairIndex);
      }
      return newSet;
    });
  };

  // 切换全部邻号对
  const toggleAllAdjacentPairs = () => {
    const allPairs = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const isAllSelected = [...allPairs].every((i) => excludeAdjacentPairs.has(i));
    setExcludeAdjacentPairs(isAllSelected ? new Set() : allPairs);
  };

  // 渲染邻号对按钮
  const renderAdjacentButtons = () => {
    const pairLabels = ["01", "12", "23", "34", "45", "56", "67", "78", "89", "90"];
    return (
      <div className="mb-6">
        <div className="flex items-start mb-3">
          {renderRuleHeader("adjacentPairs", "去邻号")}
          <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
            {/* 全部按钮 */}
            <Button
              onClick={withHapticFeedback(toggleAllAdjacentPairs, "medium")}
              onTouchStart={() => triggerHapticFeedback("light")}
              className={`h-10 px-2 sm:h-12 sm:px-3 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${[...Array(10)].every((_, i) => excludeAdjacentPairs.has(i))
                ? (filterModes.adjacentPairs === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
                : "bg-orange-400 hover:bg-orange-500 text-white"
                }`}
              style={{
                touchAction: "manipulation",
              }}
            >
              全部
            </Button>
            {/* 邻号对按钮 01 12 23 ... 90 */}
            {pairLabels.map((label, index) => (
              <Button
                key={index}
                onClick={withHapticFeedback(() => toggleAdjacentPair(index), "light")}
                onTouchStart={() => triggerHapticFeedback("light")}
                className={`h-10 px-2 sm:h-12 sm:px-3 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${excludeAdjacentPairs.has(index)
                  ? (filterModes.adjacentPairs === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
                  : "bg-orange-400 hover:bg-orange-500 text-white"
                  }`}
                style={{
                  touchAction: "manipulation",
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染不定位两码按钮 (00-99)
  const renderUnfixedTwoCodeButtons = () => {
    // 根据图片逻辑构造网格数据
    const grid = [
      ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "99"],
      ["11", "12", "13", "14", "15", "16", "17", "18", "19", "88", "89"],
      ["22", "23", "24", "25", "26", "27", "28", "29", "77", "78", "79"],
      ["33", "34", "35", "36", "37", "38", "39", "66", "67", "68", "69"],
      ["44", "45", "46", "47", "48", "49", "55", "56", "57", "58", "59"],
      ["55", "56", "57", "58", "59", "44", "45", "46", "47", "48", "49"],
      ["66", "67", "68", "69", "33", "34", "35", "36", "37", "38", "39"],
      ["77", "78", "79", "22", "23", "24", "25", "26", "27", "28", "29"],
      ["88", "89", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
      ["99", "00", "01", "02", "03", "04", "05", "06", "07", "08", "09"],
    ];

    const togglePair = (pair: string, isKeepZone: boolean) => {
      if (isKeepZone) {
        setKeepTwoCodes((prev) => {
          const next = new Set(prev);
          if (next.has(pair)) next.delete(pair);
          else next.add(pair);
          return next;
        });
      } else {
        setKillTwoCodes((prev) => {
          const next = new Set(prev);
          if (next.has(pair)) next.delete(pair);
          else next.add(pair);
          return next;
        });
      }
    };

    const toggleAll = () => {
      if (keepTwoCodes.size > 0 || killTwoCodes.size > 0) {
        setKeepTwoCodes(new Set());
        setKillTwoCodes(new Set());
      }
    };

    return (
      <div className="mb-6 flex">
        {/* 左侧标题 */}
        <div className="flex flex-col items-center mr-2 sm:mr-4 w-12 sm:w-16 shrink-0 mt-2">
          <div className="text-orange-500 text-sm sm:text-lg font-bold leading-tight">
            不定位
          </div>
          <div className="text-orange-500 text-sm sm:text-lg font-bold leading-tight">
            两码
          </div>
        </div>

        <div className="flex-1 overflow-x-auto scroller-hidden">
          {/* 顶部操作栏 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold">
              <span className="text-gray-700">必含</span> /
              <span className="text-red-500 ml-1">不含(杀)</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={withHapticFeedback(toggleAll, "medium")}
              className="h-7 px-3 text-xs"
            >
              全选
            </Button>
          </div>

          {/* 按钮网格 */}
          <div className="flex flex-col gap-1 min-w-max pb-2">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1">
                {row.map((pair, colIndex) => {
                  // 根据图片规律判断是否属于红区（杀号区）
                  // 规律：R0有一个红(col10), R1有二个(col9,10), ..., R4有五个, 
                  // R5开始从中间劈开，红区占比变大
                  const isRedArea = (rowIndex === 0 && colIndex >= 10) ||
                    (rowIndex === 1 && colIndex >= 9) ||
                    (rowIndex === 2 && colIndex >= 8) ||
                    (rowIndex === 3 && colIndex >= 7) ||
                    (rowIndex === 4 && colIndex >= 6) ||
                    (rowIndex === 5 && colIndex >= 5) ||
                    (rowIndex === 6 && colIndex >= 4) ||
                    (rowIndex === 7 && colIndex >= 3) ||
                    (rowIndex === 8 && colIndex >= 2) ||
                    (rowIndex === 9 && colIndex >= 1);

                  const isSelected = isRedArea
                    ? killTwoCodes.has(pair)
                    : keepTwoCodes.has(pair);

                  return (
                    <Button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={withHapticFeedback(
                        () => togglePair(pair, !isRedArea),
                        "light"
                      )}
                      className={`w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm font-bold transition-all border-2 ${isSelected
                        ? (isRedArea ? "bg-red-500 border-red-700 shadow-inner" : "bg-green-500 border-green-700 shadow-inner") + " text-white"
                        : (isRedArea ? "bg-orange-400 border-red-500 hover:bg-orange-500" : "bg-orange-400 border-green-500 hover:bg-orange-500") + " text-white shadow-sm"
                        }`}
                    >
                      {pair}
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧提示文案 (移动端隐藏或另行优化) */}
        <div className="hidden lg:block w-48 ml-4 text-[10px] text-gray-500 border-l pl-2 leading-normal self-center">
          <div className="flex items-start gap-1">
            <span className="p-0.5 bg-gray-100 rounded leading-none">ⓘ</span>
            <p>
              不定位两码：对于豹子号，只有一组两码，如999则为99；对于组三号，有两组两码，如227-22、27；对于组六号，有三组两码，如571-15、17、27。
            </p>
          </div>
        </div>
      </div>
    );
  };


  // 渲染连号选择按钮
  const renderConsecutiveButtons = (
    type: "four" | "three" | "two",
    label: string,
    excludedSet: Set<number>
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        {renderRuleHeader(type, label)}
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllConsecutive(type)}
            className={`w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${[...Array(10)].every((_, i) => excludedSet.has(i))
              ? (filterModes[type] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
              className={`w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-semibold transition-colors ${excludedSet.has(digit)
                ? (filterModes[type] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
    type: "anyTwoSame" | "anyThreeSame" | "anyTwoSum" | "anyThreeSum" | "anyFourSum",
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
    } else if (type === "anyFourSum") {
      const newSet = new Set(excludeAnyFourSum);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      setExcludeAnyFourSum(newSet);
    }
  };

  // 切换全部任意位的排除状态
  const toggleAllAny = (
    type: "anyTwoSame" | "anyThreeSame" | "anyTwoSum" | "anyThreeSum" | "anyFourSum"
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
    } else if (type === "anyFourSum") {
      const allSums = new Set(Array.from({ length: 37 }, (_, i) => i)); // 0-36
      const isAllSelected = [...allSums].every((sum) =>
        excludeAnyFourSum.has(sum)
      );
      setExcludeAnyFourSum(isAllSelected ? new Set() : allSums);
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
        {renderRuleHeader(type, label)}
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllAny(type)}
            className={`w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${[...Array(10)].every((_, i) => excludedSet.has(i))
              ? (filterModes[type] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
              className={`w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg font-semibold transition-colors ${excludedSet.has(digit)
                ? (filterModes[type] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
    type: "anyTwoSum" | "anyThreeSum" | "anyFourSum",
    label: string,
    excludedSet: Set<number>,
    maxValue: number
  ) => (
    <div className="mb-6">
      <div className="flex items-start mb-3">
        {renderRuleHeader(type, label)}
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-1">
          {/* 全部按钮 */}
          <Button
            onClick={() => toggleAllAny(type)}
            className={`size-8 sm:size-12 text-xs sm:text-sm font-semibold transition-colors ${[...Array(maxValue + 1)].every((_, i) => excludedSet.has(i))
              ? (filterModes[type] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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
              className={`w-8 h-8 sm:w-12 sm:h-12 text-xs sm:text-sm font-semibold transition-colors ${excludedSet.has(sum)
                ? (filterModes[type] === "keep" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600") + " text-white"
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

                  {/* 邻号规则 */}
                  {renderAdjacentButtons()}

                  <Separator className="my-4" />

                  {/* 不定位两码 */}
                  {renderUnfixedTwoCodeButtons()}

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
                    "anyFourSum",
                    "去四和",
                    excludeAnyFourSum,
                    36
                  )}
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
                multiple
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
                  className={`px-4 sm:px-8 py-3 text-base sm:text-lg transition-colors ${importSuccess
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
                  className={`px-4 sm:px-8 py-3 text-base sm:text-lg transition-colors ${resetSuccess
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
