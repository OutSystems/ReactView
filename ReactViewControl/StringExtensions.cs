using System;
using System.Globalization;

namespace ReactViewControl {

    internal static class StringExtensions {
        public static bool InvariantContains(this string str, string value) => str.IndexOf(value, 0, StringComparison.InvariantCulture) > -1;

        public static bool InvariantStartsWith(this string str, string value) => str.StartsWith(value, false, CultureInfo.InvariantCulture);

        public static int InvariantIndexOf(this string str, string value) => str.IndexOf(value, 0, StringComparison.InvariantCulture);
    }
}