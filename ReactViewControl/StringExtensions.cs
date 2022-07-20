using System;
using System.Globalization;

namespace ReactViewControl {

      internal static class StringExtensions {
        public static bool ContainsOrdinal(this string str, string value) => str.IndexOf(value, 0, StringComparison.Ordinal) > -1;

        public static bool StartsWithOrdinal(this string str, string value) => str.StartsWith(value, StringComparison.Ordinal);

        public static int IndexOfOrdinal(this string str, string value) => str.IndexOf(value, 0, StringComparison.Ordinal);
    }
}