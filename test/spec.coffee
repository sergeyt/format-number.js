formatNumber = require '../format-number'
should = require 'should'

f = (value, format) ->
	formatNumber value, format

describe "formatNumber", ->
	it "should support standard format strings", ->
		f(100).should.eql "100"

		# general
		f(100, "G").should.eql "100"
		f(100, "g").should.eql "100"

		# percent
		f(0.12, "P").should.eql "12%"
		f(0.12, "p").should.eql "12%"
		f(0.12345, "P2").should.eql "12.35%"
		f(0.12345, "p2").should.eql "12.35%"

		# hex
		f(10.2, "X").should.eql "A"
		f(10.2, "x").should.eql "a"
		f(10.2, "X2").should.eql "0A"
		f(10.2, "x2").should.eql "0a"

		f(NaN, "G").should.eql "NaN"

	it "should support currency format strings", ->
		f(100, "C").should.eql "$100.00"
		f(100, "c").should.eql "$100.00"
		f(100, "C0").should.eql "$100"
		f(100, "c0").should.eql "$100"
		f(1.2, "C0").should.eql "$1"
		f(1.2, "c0").should.eql "$1"
		f(1.235, "C2").should.eql "$1.24"
		f(1.235, "c2").should.eql "$1.24"
		f(-1.235, "C2").should.eql "($1.24)"
		f(-1.235, "c2").should.eql "($1.24)"
		# currency groups
		f(1234.123, "c2").should.eql "$1,234.12"
		f(-1234.123, "c2").should.eql "($1,234.12)"
		f(123123.123, "c2").should.eql "$123,123.12"

	it "should support custom format strings", ->
		max = 2147483647
		min = -2147483648

		# custom
		f(0.45678, "0.00").should.eql "0.46"

		f(0, "0").should.eql "0"
		f(0, "00000000000").should.eql "00000000000"
		f(0, " 00000000000").should.eql " 00000000000"

		f(0, "#").should.eql ""
		f(0, "##########").should.eql ""

		f(0, ".").should.eql ""
		f(max, ".").should.eql ""
		f(min, ".").should.eql "-"

		f(0, "00000000000.").should.eql "00000000000"
		f(max, "00000000000.").should.eql "02147483647"
		f(min, "00000000000.").should.eql "-02147483648"

		f(0, ".00000000000").should.eql ".00000000000"
		f(max, ".00000000000").should.eql "2147483647.00000000000"
		f(min, ".00000000000").should.eql "-2147483648.00000000000"

		f(0, "00000000000.00000000000").should.eql "00000000000.00000000000"
		f(max, "00000000000.00000000000").should.eql "02147483647.00000000000"
		f(min, "00000000000.00000000000").should.eql "-02147483648.00000000000"

		f(0, "00.0.00.000.0000").should.eql "00.0000000000"
		f(1, "00.0.00.000.0000").should.eql "01.0000000000"
		f(-1, "00.0.00.000.0000").should.eql "-01.0000000000"

		f(0, "##.#.##.###.####").should.eql ""
		f(1, "##.#.##.###.####").should.eql "1"
		f(-1, "##.#.##.###.####").should.eql "-1"

		f(0, "0#.#.##.###.####").should.eql "00"
		f(1, "0#.#.##.###.####").should.eql "01"
		f(-1, "0#.#.##.###.####").should.eql "-01"

		f(0, "#0.#.##.###.####").should.eql "0"
		f(1, "#0.#.##.###.####").should.eql "1"
		f(-1, "#0.#.##.###.####").should.eql "-1"

		f(0, "##.#.##.###.###0").should.eql ".0000000000"
		f(1, "##.#.##.###.###0").should.eql "1.0000000000"
		f(-1, "##.#.##.###.###0").should.eql "-1.0000000000"

		f(0, "##.#.##.###.##0#").should.eql ".000000000"
		f(1, "##.#.##.###.##0#").should.eql "1.000000000"
		f(-1, "##.#.##.###.##0#").should.eql "-1.000000000"

		f(0, "##.#.##.##0.##0#").should.eql ".000000000"
		f(1, "##.#.##.##0.##0#").should.eql "1.000000000"
		f(-1, "##.#.##.##0.##0#").should.eql "-1.000000000"

		f(0, "#0.#.##.##0.##0#").should.eql "0.000000000"
		f(1, "#0.#.##.##0.##0#").should.eql "1.000000000"
		f(-1, "#0.#.##.##0.##0#").should.eql "-1.000000000"

		# Test08018
		f(min, "0000000000,").should.eql "-0002147484"
		f(min, "0000000000,,").should.eql "-0000002147"
		f(min, "0000000000,,,").should.eql "-0000000002"
		f(min, "0000000000,,,,").should.eql "0000000000"
		f(min,
		  "0000000000,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,").should.eql "0000000000"

		# Test08019 - Test08035
		f(min, ",0000000000").should.eql "-2147483648"
		f(min, ",0000000000,").should.eql "-0002147484"
		f(min, "0,0000000000").should.eql "-02,147,483,648"
		f(min, "0000000000,0").should.eql "-02,147,483,648"
		f(min, "0,0,0,0,0,0,0,0,0,0,0").should.eql "-02,147,483,648"
		f(min, ",0,0,0,0,0,0,0,0,0,0,0").should.eql "-02,147,483,648"
		f(min, "0,0,0,0,0,0,0,0,0,0,0,").should.eql "-00,002,147,484"
		f(min, ",0,0,0,0,0,0,0,0,0,0,0,").should.eql "-00,002,147,484"
		f(min, ",").should.eql "-"
		f(min, ",##########").should.eql "-2147483648"
		f(min, ",##########,").should.eql "-2147484"
		f(min, "#,##########").should.eql "-2,147,483,648"
		f(min, "##########,#").should.eql "-2,147,483,648"
		f(min, "#,#,#,#,#,#,#,#,#,#,#").should.eql "-2,147,483,648"
		f(min, ",#,#,#,#,#,#,#,#,#,#,#").should.eql "-2,147,483,648"
		f(min, "#,#,#,#,#,#,#,#,#,#,#,").should.eql "-2,147,484"
		f(min, ",#,#,#,#,#,#,#,#,#,#,#,").should.eql "-2,147,484"

		# Test08036 - Test08049
		f(-1000, "##########,").should.eql "-1"
		f(-100, "##########,").should.eql ""
		f(min, "%").should.eql "-%"
		f(min, "0%").should.eql "-214748364800%"
		f(min, "%0").should.eql "-%214748364800"
		f(min, "%0%").should.eql "-%21474836480000%"
		f(min, " % 0 % ").should.eql "- % 21474836480000 % "
		f(min, "0%,").should.eql "-214748365%"
		f(min, "0,%").should.eql "-214748365%"
		f(min, ",%0").should.eql "-%214748364800"
		f(min, "%,0").should.eql "-%214748364800"
		f(min, "0,,,,%%%%%%").should.eql "-2147483648%%%%%%"
		f(min, "0%%%%%%,,,,").should.eql "-2147483648%%%%%%"
		f(min, "%%%%%%0,,,,").should.eql "-%%%%%%2147483648"

		# Test08050
		f(min, "E+0").should.eql "E+0"
		f(min, "e+0").should.eql "e+0"
		#f(min, "E0").should.eql "E-0"
		#f(min, "e0").should.eql "e-0"

		# Test08077
		f(min, ";").should.eql "-"
		f(max, ";").should.eql ""
		f(0, ";").should.eql ""

		# Test08078
		f(min, "#,#;").should.eql "-2,147,483,648"
		f(max, "#,#;").should.eql "2,147,483,647"
		f(0, "#,#;").should.eql ""

		# Test08079
		f(min, ";#,#").should.eql "2,147,483,648"
		f(max, ";#,#").should.eql ""
		f(0, ";#,#").should.eql ""

		# Test08080
		f(min, "0000000000,.0000000000;#,#").should.eql "2,147,483,648"
		# ignore due to rounding error
		# f(max, "0000000000,.0000000000;#,#").should.eql "0002147483.6470000000"
		f(0, "0000000000,.0000000000;#,#").should.eql "0000000000.0000000000"

		# Test08081
		f(min, ";;").should.eql "-"
		f(max, ";;").should.eql ""
		f(0, ";;").should.eql ""

		# Test08082
		f(min, ";;0%").should.eql "-"
		f(max, ";;0%").should.eql ""
		f(0, ";;0%").should.eql "0%"

		# Test08083
		f(min, ";0,;0%").should.eql "2147484"
		f(max, ";0,;0%").should.eql ""
		f(0, ";0,;0%").should.eql "0%"

		# Test08091
		f(min, "A0,;B0,,;C0,,,;D0,,,,;E0,,,,,").should.eql "B2147"
		f(max, "A0,;B0,,;C0,,,;D0,,,,;E0,,,,,").should.eql "A2147484"
		f(0, "A0,;B0,,;C0,,,;D0,,,,;E0,,,,,").should.eql "C0"

		# Test12010 - Test12015
		f(0, "+F").should.eql "+F"
		f(0, "F+").should.eql "F+"
		f(0, "+F+").should.eql "+F+"
		f(max, "+F").should.eql "+F"
		f(max, "F+").should.eql "F+"
		f(max, "+F+").should.eql "+F+"
		f(min, "+F").should.eql "-+F"
		f(min, "F+").should.eql "-F+"
		f(min, "+F+").should.eql "-+F+"
		f(0, "-F").should.eql "-F"
		f(0, "F-").should.eql "F-"
		f(0, "-F-").should.eql "-F-"
		f(max, "-F").should.eql "-F"
		f(max, "F-").should.eql "F-"
		f(max, "-F-").should.eql "-F-"
		f(min, "-F").should.eql "--F"
		f(min, "F-").should.eql "-F-"
		f(min, "-F-").should.eql "--F-"

		# Test12017 - Test12018
		f(0, "F+9").should.eql "F+9"
		f(max, "F+9").should.eql "F+9"
		f(min, "F+9").should.eql "-F+9"
		f(0, "F-9").should.eql "F-9"
		f(max, "F-9").should.eql "F-9"
		f(min, "F-9").should.eql "-F-9"
