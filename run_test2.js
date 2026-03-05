const fs = require('fs');

const filterModes = { anyTwoSame: "keep" };
const excludeAnyTwoSame = new Set([1]);

function shouldKeepNumber(num) {
    const digits = num.split('').map(Number);
    
    const checkRule = (key, set, isMatch) => {
        if (set.size === 0) return true;
        const mode = filterModes[key] || "exclude";
        return mode === "exclude" ? !isMatch : isMatch;
    };

    const hasAnyTwoSame = (digits, targetDigit) => {
        const count = digits.filter((d) => d === targetDigit).length;
        return count >= 2;
    };

    const hasAnyTwoSameMatch = Array.from(excludeAnyTwoSame).some((d) =>
        hasAnyTwoSame(digits, d)
    );

    if (!checkRule("anyTwoSame", excludeAnyTwoSame, hasAnyTwoSameMatch))
      return false;

    return true;
}

const res = ["1123", "2222", "1213", "1234", "3131"].filter(shouldKeepNumber);
console.log(res);
