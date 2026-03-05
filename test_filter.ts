const filterModes = { thousands: "keep" };
const excludedNumbers = {
    thousands: new Set([1]),
    hundreds: new Set(),
    tens: new Set(),
    units: new Set(),
    thousandsHundreds: new Set(),
    thousandsTens: new Set(),
    thousandsUnits: new Set(),
    hundredsTens: new Set(),
    hundredsUnits: new Set(),
    tensUnits: new Set(),
    thousandsHundredsTens: new Set(),
    thousandsHundredsUnits: new Set(),
    thousandsTensUnits: new Set(),
    hundredsTensUnits: new Set(),
};
const excludeFourSameNumbers = new Set();
const excludeThreeConsecutiveSameNumbers = new Set();
const excludeTwoConsecutiveSameNumbers = new Set();
const excludeAdjacentPairs = new Set();
const excludeAnyThreeSame = new Set();
const excludeAnyTwoSame = new Set();
const excludeAnyThreeSum = new Set();
const excludeAnyTwoSum = new Set();

const hasConsecutiveSameDigit = (digits, targetDigit, count) => false;
const hasAdjacentPair = (digits, pairIdx) => false;
const hasAnyThreeSame = (digits, targetDigit) => false;
const hasAnyTwoSame = (digits, targetDigit) => false;
const hasAnyThreeSum = (digits, targetSum) => false;
const hasAnyTwoSum = (digits, targetSum) => false;

const shouldKeepNumber = (num) => {
    const digits = num.split("").map(Number);
    const [thousands, hundreds, tens, units] = digits;

    const checkRule = (key, set, isMatch) => {
      if (set.size === 0) return true;
      const mode = filterModes[key] || "exclude";
      return mode === "exclude" ? !isMatch : isMatch;
    };

    const hasFourMatch = Array.from(excludeFourSameNumbers).some((d) =>
      hasConsecutiveSameDigit(digits, d, 4)
    );
    if (!checkRule("four", excludeFourSameNumbers, hasFourMatch)) return false;

    if (!checkRule("thousands", excludedNumbers.thousands, excludedNumbers.thousands.has(thousands))) return false;
    if (!checkRule("hundreds", excludedNumbers.hundreds, excludedNumbers.hundreds.has(hundreds))) return false;

    return true;
};

console.log("1000 =>", shouldKeepNumber("1000"));
console.log("2000 =>", shouldKeepNumber("2000"));
