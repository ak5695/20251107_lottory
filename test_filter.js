const filterModes = { thousands: "keep" };
const excludedNumbers = {
    thousands: new Set([1]),
    hundreds: new Set([]), // Empty
    tens: new Set([]),
    units: new Set([]),
    thousandsHundreds: new Set([]),
    thousandsTens: new Set([]),
    thousandsUnits: new Set([]),
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

const ADJACENT_PAIRS = [ [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0] ];
const hasAdjacentPair = (digits, pairIndex) => {
    const [a, b] = ADJACENT_PAIRS[pairIndex];
    const hasA = digits.includes(a);
    const hasB = digits.includes(b);
    return hasA && hasB;
};

const hasConsecutiveSameDigit = (digits, targetDigit, count) => {
    if (count === 4) return digits.every((d) => d === targetDigit);
    return false; // stub
};
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

    if (excludeAdjacentPairs.size > 0) {
      const hasAdjMatch = Array.from(excludeAdjacentPairs).some((pairIdx) =>
        hasAdjacentPair(digits, pairIdx)
      );
      if (!checkRule("adjacentPairs", excludeAdjacentPairs, hasAdjMatch))
        return false;
    }

    if (!checkRule("thousands", excludedNumbers.thousands, excludedNumbers.thousands.has(thousands))) return false;
    if (!checkRule("hundreds", excludedNumbers.hundreds, excludedNumbers.hundreds.has(hundreds))) return false;

    return true;
};

const numbers = [];
for(let i=0; i<10000; i++) numbers.push(i.toString().padStart(4, "0"));
const filtered = numbers.filter(shouldKeepNumber);
console.log("Filtered length:", filtered.length);
