using System;
using System.Globalization;

namespace ReactViewControl {

    internal static class StringExtensions {
        public static bool OrdinalContains(this string str, string value) => str.IndexOf(value, 0, StringComparison.Ordinal) > -1;

        public static bool OrdinalStartsWith(this string str, string value) => str.StartsWith(value, StringComparison.Ordinal);

        public static int OrdinalIndexOf(this string str, string value) => str.IndexOf(value, 0, StringComparison.Ordinal);
    }
}