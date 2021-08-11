using System;

namespace Sample.Avalonia {
    public static class Settings {

        public static event Action ThemeChanged;

        public static bool isLightTheme = true;
        public static bool IsLightTheme {
            get => isLightTheme;
            set {
                isLightTheme = value;
                ThemeChanged?.Invoke();
            }
        }
    }
}
