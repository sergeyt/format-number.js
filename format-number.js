(function (window, undefined) {

	// from https://github.com/jquery/globalize
	var default_culture = {
		// numberFormat defines general number formatting rules, like the digits in
		// each grouping, the group separator, and how negative numbers are displayed.
		numberFormat: {
			// [negativePattern]
			// Note, numberFormat.pattern has no "positivePattern" unlike percent and currency,
			// but is still defined as an array for consistency with them.
			//   negativePattern: one of "(n)|-n|- n|n-|n -"
			pattern: [ "-n" ],
			// number of decimal places normally shown
			decimals: 2,
			// string that separates number groups, as in 1,000,000
			",": ",",
			// string that separates a number from the fractional portion, as in 1.99
			".": ".",
			// array of numbers indicating the size of each number group.
			// TODO: more detailed description and example
			groupSizes: [ 3 ],
			// symbol used for positive numbers
			"+": "+",
			// symbol used for negative numbers
			"-": "-",
			// symbol used for NaN (Not-A-Number)
			"NaN": "NaN",
			// symbol used for Negative Infinity
			negativeInfinity: "-Infinity",
			// symbol used for Positive Infinity
			positiveInfinity: "Infinity",
			percent: {
				// [negativePattern, positivePattern]
				//   negativePattern: one of "-n %|-n%|-%n|%-n|%n-|n-%|n%-|-% n|n %-|% n-|% -n|n- %"
				//   positivePattern: one of "n %|n%|%n|% n"
				pattern: [ "-n %", "n %" ],
				// number of decimal places normally shown
				decimals: 2,
				// array of numbers indicating the size of each number group.
				// TODO: more detailed description and example
				groupSizes: [ 3 ],
				// string that separates number groups, as in 1,000,000
				",": ",",
				// string that separates a number from the fractional portion, as in 1.99
				".": ".",
				// symbol used to represent a percentage
				symbol: "%"
			},
			currency: {
				// [negativePattern, positivePattern]
				//   negativePattern: one of "($n)|-$n|$-n|$n-|(n$)|-n$|n-$|n$-|-n $|-$ n|n $-|$ n-|$ -n|n- $|($ n)|(n $)"
				//   positivePattern: one of "$n|n$|$ n|n $"
				pattern: [ "($n)", "$n" ],
				// number of decimal places normally shown
				decimals: 2,
				// array of numbers indicating the size of each number group.
				// TODO: more detailed description and example
				groupSizes: [ 3 ],
				// string that separates number groups, as in 1,000,000
				",": ",",
				// string that separates a number from the fractional portion, as in 1.99
				".": ".",
				// symbol used to represent currency
				symbol: "$"
			}
		}
	};

	function formatNumber(value, format, culture) {

		if (!culture){
			culture = default_culture;
		}

		if (!isFinite(value)) {
			if (value === Infinity) {
				return culture.numberFormat.positiveInfinity;
			}
			if (value === -Infinity) {
				return culture.numberFormat.negativeInfinity;
			}
			return culture.numberFormat.NaN;
		}

		format = format || "g";

		// standard format strings
		if ((/^\w\d*$/).test(format)) {

			var formatInfo = culture.numberFormat;
			var precision = -1;
			var s;
			var negative = value < 0;

			if (format.length > 1) {
				precision = parseInt(format.slice(1), 10);
			}

			switch (format.charAt(0)) {
				case 'G':
				case 'g':
					if (Math.round(value) == value) {
						return value.toString();
					}
					if (precision < 0) precision = formatInfo.decimals;
					return format_fixed(value, precision, formatInfo);

				case 'F':
				case 'f':
				case 'R':
				case 'r':
				case 'N':
				case 'n':
					if (precision < 0) precision = formatInfo.decimals;
					return format_fixed(value, precision, formatInfo);

				case 'X':
					if (precision < 0) precision = 0;
					s = truncate(value).toString(16).toUpperCase();
					return lpad(s, precision);
				case 'x':
					if (precision < 0) precision = 0;
					s = truncate(value).toString(16);
					return lpad(s, precision);

				case 'd':
				case 'D':
					if (precision < 0) precision = 0;
					s = truncate(Math.abs(value)).toString();
					if (negative) {
						return formatInfo["-"] + lpad(s, precision - 1);
					}
					return lpad(s, precision);

				// percent
				case 'p':
				case 'P':
					if (precision < 0) precision = 0;
					value = value * 100;
					return format_fixed(value, precision, formatInfo) + formatInfo.percent.symbol;

				case "c":
				case "C":
					if (precision === -1) precision = formatInfo.decimals;
					var pattern = value < 0 ? formatInfo.currency.pattern[0] : (formatInfo.currency.pattern[1] || "n");
					var number = expand_number(Math.abs(value), precision, formatInfo);
					return format_pattern(number, pattern, formatInfo);
			}
		}

		return format_custom(value, format, culture);
	}

	function format_fixed(value, precision, formatInfo) {
		value = precision === 0 ? Math.round(value) : value.toFixed(precision);
		var s = Math.abs(value).toString();
		return value < 0 ? formatInfo["-"] + s : s;
	}

	function format_pattern(number, pattern, formatInfo) {
		var patternParts = /n|\$|-|%/g;
		var ret = "";
		while (true) {
			var index = patternParts.lastIndex,
				ar = patternParts.exec(pattern);

			ret += pattern.slice(index, ar ? ar.index : pattern.length);

			if (!ar) {
				break;
			}

			switch (ar[0]) {
				case "n":
					ret += number;
					break;
				case "$":
					ret += formatInfo.currency.symbol;
					break;
				case "-":
					// don't make 0 negative
					if (/[1-9]/.test(number)) {
						ret += formatInfo["-"];
					}
					break;
				case "%":
					ret += formatInfo.percent.symbol;
					break;
			}
		}

		return ret;
	}

	function expand_number(number, precision, formatInfo) {
		var groupSizes = formatInfo.groupSizes,
			curSize = groupSizes[ 0 ],
			curGroupIndex = 1,
			factor = Math.pow(10, precision),
			rounded = Math.round(number * factor) / factor;

		if (!isFinite(rounded)) {
			rounded = number;
		}
		number = rounded;

		var numberString = number + "",
			right,
			split = numberString.split(/e/i),
			exponent = split.length > 1 ? parseInt(split[1], 10) : 0;
		numberString = split[ 0 ];
		split = numberString.split(".");
		numberString = split[ 0 ];
		right = split.length > 1 ? split[ 1 ] : "";

		if (exponent > 0) {
			right = rpad(right, exponent);
			numberString += right.slice(0, exponent);
			right = right.substr(exponent);
		} else if (exponent < 0) {
			exponent = -exponent;
			numberString = lpad(numberString, exponent + 1);
			right = numberString.slice(-exponent, numberString.length) + right;
			numberString = numberString.slice(0, -exponent);
		}

		if (precision > 0) {
			right = formatInfo[ "." ] +
				( (right.length > precision) ? right.slice(0, precision) : rpad(right, precision) );
		} else {
			right = "";
		}

		var stringIndex = numberString.length - 1,
			sep = formatInfo[ "," ],
			ret = "";

		while (stringIndex >= 0) {
			if (curSize === 0 || curSize > stringIndex) {
				return numberString.slice(0, stringIndex + 1) + ( ret.length ? (sep + ret + right) : right );
			}
			ret = numberString.slice(stringIndex - curSize + 1, stringIndex + 1) + ( ret.length ? (sep + ret) : "" );

			stringIndex -= curSize;

			if (curGroupIndex < groupSizes.length) {
				curSize = groupSizes[ curGroupIndex ];
				curGroupIndex++;
			}
		}

		return numberString.slice(0, stringIndex + 1) + sep + ret + right;
	}

	// Custom Format

	function format_custom(value, format, culture) {
		var sectionInfo = parse_format_sections(value, format);
		format = sectionInfo.format;

		var positive = true;
		if (value < 0) {
			if (!sectionInfo.negative) {
				positive = false;
			}
			value = -value;
		}

		if (value === 0 && sectionInfo.zero) {
			format = sectionInfo.zero;
		}

		var formatInfo = culture.numberFormat;

		if (format.length === 0) {
			return positive ? "" : formatInfo["-"];
		}

		var info = parse_custom_format(format);

		var partInt = '';
		var partDec = '';
		var partExp = '';

		var numstr = value.toString();
		var decPointPos = numstr.indexOf('.');
		if (decPointPos < 0) decPointPos = numstr.length;

		var mul = 1;
		if (info.Percents > 0 && numstr.length > 0) {
			decPointPos += 2 * info.Percents;
			mul *= Math.pow(100, info.Percents);
		}
		if (info.Permilles > 0 && numstr.length > 0) {
			decPointPos += 3 * info.Permilles;
			mul *= Math.pow(1000, info.Permilles);
		}
		if (info.DividePlaces > 0 && numstr.length > 0) {
			decPointPos -= info.DividePlaces;
			mul /= Math.pow(10, info.DividePlaces);
		}
		if (decPointPos < 0) {
			decPointPos = -1;
		}

		var expPositive = true;
		if (info.UseExponent && (info.DecimalDigits > 0 || info.IntegerDigits > 0)) {
			var estr = (value * mul).toExponential(info.ExponentDigits);
			var eindex = numstr.indexOf('e');
			if (eindex >= 0) {
				numstr = estr.substr(0, eindex);
				partExp = estr.substr(eindex + 1);
				decPointPos = numstr.indexOf('.');
				if (decPointPos < 0) decPointPos = numstr.length;
			}
		} else {
			var fixed = (value * mul).toFixed(info.DecimalDigits);
			if (fixed === 0 || fixed == '0') {
				positive = true;
			}
			numstr = fixed.toString();
			decPointPos = numstr.indexOf('.');
			if (decPointPos < 0) decPointPos = numstr.length;
		}

		if (info.IntegerDigits !== 0 || !(numstr.length === 0 || decPointPos <= 0)) {
			var count = decPointPos > 0 ? decPointPos : 1;
			partInt = numstr.substr(0, Math.min(count, numstr.length));
		}

		if (decPointPos < numstr.length)
			partDec = numstr.substr(decPointPos + 1);

		if (info.UseExponent) {
			if (info.DecimalDigits <= 0 && info.IntegerDigits <= 0)
				positive = true;

			partInt = lpad(partInt, info.IntegerDigits);
			partExp = lpad(partExp, info.ExponentDigits - info.ExponentTailSharpDigits);

			if (expPositive && !info.ExponentNegativeSignOnly)
				partExp = formatInfo["+"] + partExp;
			else if (!expPositive)
				partExp = formatInfo["-"] + partExp;
		} else {
			partInt = lpad(partInt, info.IntegerDigits - info.IntegerHeadSharpDigits);
			if (info.IntegerDigits == info.IntegerHeadSharpDigits && is_zero_only(partInt)) {
				partInt = "";
			}
		}

		partDec = rtrim_zeros(partDec);
		partDec = rpad(partDec, info.DecimalDigits - info.DecimalTailSharpDigits);
		if (partDec.length > info.DecimalDigits)
			partDec = partDec.substr(0, info.DecimalDigits);

		return format_custom_core(info, format, formatInfo, positive, partInt, partDec, partExp);
	}

	function format_custom_core(info, format, formatInfo, positive, partInt, partDec, partExp) {

		var perMilesSymbol = '\u2030';
		var result = '';
		var literal = '\0';
		var integerArea = true;
		var decimalArea = false;
		var decIndex = 0;
		var addInt = true;
		var i;

		var groupSize = formatInfo.groupSizes[0];
		if (info.UseGroup && partInt.length > groupSize) {
			partInt = insertSep(partInt, formatInfo[","], groupSize);
		}

		var length = format.length;
		for (i = 0; i < length; i++) {
			var c = format.charAt(i);

			if (c == literal && c != '\0') {
				literal = '\0';
				continue;
			}
			if (literal != '\0') {
				result += c;
				continue;
			}

			switch (c) {
				case '\\':
					i++;
					if (i < length) result += format.charAt(i);
					break;
				case "'":
				case '"':
					literal = c;
					break;
				case '#':
				case '0':
					if (integerArea) {
						if (addInt) {
							result += partInt;
							addInt = false;
						}
						break;
					}
					else if (decimalArea) {
						if (decIndex < partDec.length)
							result += partDec.charAt(decIndex++);
						break;
					}
					result += c;
					break;
				case 'e':
				case 'E':
					if (!partExp || !info.UseExponent) {
						result += c;
						break;
					}

					var flag1 = true;
					var flag2 = false;

					for (var q = i + 1; q < length; q++) {
						if (format.charAt(q) == '0') {
							flag2 = true;
							continue;
						}
						if (q == i + 1 && (format.charAt(q) == '+' || format.charAt(q) == '-'))
							continue;
						if (!flag2)
							flag1 = false;
						break;
					}

					if (flag1) {
						i = q - 1;
						integerArea = info.DecimalPointPos < 0;
						decimalArea = !integerArea;

						result += c + partExp;
						partExp = null;
					}
					else result += c;
					break;
				case '.':
					if (info.DecimalPointPos == i) {
						if (info.DecimalDigits > 0 && addInt) {
							result += partInt;
							addInt = false;
						}
						if (partDec.length > 0) {
							result += formatInfo["."];
						}
					}
					integerArea = false;
					decimalArea = true;
					break;
				case ',':
					break;
				case '%':
					result += formatInfo.percent.symbol;
					break;
				case '\u2030':
					result += perMilesSymbol;
					break;
				default:
					result += c;
					break;
			}
		}

		if (!positive) {
			result = formatInfo["-"] + result;
		}

		return result;
	}

	function parse_custom_format(format) {

		var info = {
			UseGroup: false,
			DecimalDigits: 0,
			DecimalPointPos: -1,
			DecimalTailSharpDigits: 0,
			IntegerDigits: 0,
			IntegerHeadSharpDigits: 0,
			IntegerHeadPos: -1,
			UseExponent: false,
			ExponentDigits: 0,
			ExponentTailSharpDigits: 0,
			ExponentNegativeSignOnly: true,
			DividePlaces: 0,
			Percents: 0,
			Permilles: 0
		};

		var literal = '\0';
		var integerArea = true;
		var decimalArea = false;
		var exponentArea = false;
		var sharpContinues = true;
		var groupSeparatorCounter = 0;
		var length = format.length;

		function inc_digits(){
			if (info.IntegerHeadPos == -1)
				info.IntegerHeadPos = i;

			if (integerArea) {
				info.IntegerDigits++;
				if (groupSeparatorCounter > 0)
					info.UseGroup = true;
				groupSeparatorCounter = 0;
			} else if (decimalArea)
				info.DecimalDigits++;
			else if (exponentArea)
				info.ExponentDigits++;
		}

		for (var i = 0; i < length; i++) {
			var c = format.charAt(i);

			if (c == literal && c != '\0') {
				literal = '\0';
				continue;
			}
			if (literal != '\0') continue;

			if (exponentArea && (c != '\0' && c != '0' && c != '#')) {
				exponentArea = false;
				integerArea = (info.DecimalPointPos < 0);
				decimalArea = !integerArea;
				i--;
				continue;
			}

			switch (c) {
				case '\\':
					i++;
					break;
				case "'":
				case '"':
					literal = c;
					break;
				case '#':
					if (sharpContinues && integerArea)
						info.IntegerHeadSharpDigits++;
					else if (decimalArea)
						info.DecimalTailSharpDigits++;
					else if (exponentArea)
						info.ExponentTailSharpDigits++;
					inc_digits();
					break;
				case '0':
					sharpContinues = false;
					if (decimalArea)
						info.DecimalTailSharpDigits = 0;
					else if (exponentArea)
						info.ExponentTailSharpDigits = 0;
					inc_digits();
					break;
				case 'e':
				case 'E':
					if (info.UseExponent) break;
					info.UseExponent = true;
					integerArea = false;
					decimalArea = false;
					exponentArea = true;
					if (i + 1 < length) {
						var nc = format[i + 1];
						if (nc == '+')
							info.ExponentNegativeSignOnly = false;
						if (nc == '+' || nc == '-')
							i++;
						else if (nc != '0' && nc != '#') {
							info.UseExponent = false;
							if (info.DecimalPointPos < 0)
								integerArea = true;
						}
					}
					break;
				case '.':
					integerArea = false;
					decimalArea = true;
					exponentArea = false;
					if (info.DecimalPointPos == -1)
						info.DecimalPointPos = i;
					break;
				case '%':
					info.Percents++;
					break;
				case '\u2030':
					info.Permilles++;
					break;
				case ',':
					if (integerArea && info.IntegerDigits > 0)
						groupSeparatorCounter++;
					break;
			}
		}

		if (info.ExponentDigits === 0) {
			info.UseExponent = false;
		} else {
			info.IntegerHeadSharpDigits = 0;
		}

		if (info.DecimalDigits === 0) {
			info.DecimalPointPos = -1;
		}

		info.DividePlaces += groupSeparatorCounter * 3;

		return info;
	}

	function parse_format_sections(value, format) {

		var index = [];
		var start, end, section;
		var literal = '\0';

		for (start = 0; start < format.length; start++) {

			var c = format.charAt(start);

			if (c == literal && c != '\0') {
				literal = '\0';
				continue;
			}
			if (literal != '\0') {
				continue;
			}

			switch (c) {
				case '"':
				case "'":
					literal = c;
					break;
				case '\\':
					start++;
					break;
				case ';':
					index.push(start);
					break;
			}
		}

		function getSection(i, j) {
			start = index[i];
			end = index[j];
			if (format.charAt(start) == ';') start++;
			if (format.charAt(end) == ';') end--;
			return format.substring(start, end + 1);
		}

		var negative = false;
		var zero = null;

		if (index.length > 0) {
			if (format.length - 1 > index[index.length - 1]) {
				index.push(format.length - 1);
			}
			switch (index.length) {
				case 1:
					format = format.substr(0, index[0]);
					break;
				case 2:
					if (value >= 0) {
						format = format.substr(0, index[0]);
					} else {
						negative = true;
						section = getSection(0, 1);
						if (section.length === 0) {
							section = format.substr(0, index[0]);
							negative = false;
						}
						format = section;
					}
					break;
				// >= 3
				default:
					zero = getSection(1, 2);
					if (value >= 0) {
						format = format.substr(0, index[0]);
					} else {
						negative = true;
						section = getSection(0, 1);
						if (section.length === 0) {
							section = format.substr(0, index[0]);
							negative = false;
						}
						format = section;
					}
					break;
			}
		}

		return { format: format, zero: zero, negative: negative };
	}

	// Utilities

	function truncate(value) {
		return isNaN(value) ? NaN : Math[value < 0 ? "ceil" : "floor"](value);
	}

	// init zero pads
	var zpads = (function(){
		var arr = [];
		var z = '';
		for (var i = 0; i <= 20; i++){
			arr.push(z);
			z += '0';
		}
		return arr;
	})();

	function repeatz(s, count) {
		if (count < zpads.length) {
			return zpads[count];
		}
		var result = '';
		while (count > 0) {
			if (count & 1) result += s;
			count >>= 1;
			s += s;
		}
		return result;
	}

	function lpad(s, length) {
		var n = length - s.length;
		return n > 0 ? repeatz('0', n) + s : s;
	}

	function rpad(s, length) {
		var n = length - s.length;
		return n > 0 ? s + repeatz('0', n) : s;
	}

	function is_zero_only(s) {
		return (/^0*$/).test(s);
	}

	// TODO optimize
	function rtrim_zeros(s) {
		var count = 0;
		for (var i = s.length - 1; i >= 0; i--) {
			if (s.charAt(i) != '0') break;
			count++;
		}
		return count > 0 ? s.substr(0, s.length - count) : s;
	}

	function insertSep(s, sep, groupSize) {
		var i = s.length - (groupSize + 1);
		while (i >= 0) {
			s = s.substring(0, i + 1) + sep + s.substr(i + 1);
			i -= groupSize;
		}
		return s;
	}

	// exports
	if (typeof module !== "undefined") {
		module.exports = formatNumber;
	} else {
		// export as global variable
		window.formatNumber = formatNumber;
	}

}(this));
