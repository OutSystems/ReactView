using System;

namespace Example {

    partial struct MenuItem {
        
        private Action action;

        public MenuItem(string label, Action action) {
            __trackId = null;
            this.label = label;
            this.action = action;
        }

        public void Execute() {
            action.Invoke();
        }
    }
}
