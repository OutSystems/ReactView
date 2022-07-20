using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StringExtensionMethods
{
    public static class MyExtensions
    {
        public static bool InvariantContains(this string str, string value) => str.IndexOf(value, 0, StringComparison.InvariantCulture) > -1;

        public static bool InvariantStartsWith(this string str, string value) => str.StartsWith(value, false, System.Globalization.CultureInfo.InvariantCulture);
    }
}