using System;

namespace Example {

    partial struct SubMenuItem {
        
        private Action action;

        public SubMenuItem(string label, Action action) {
            __trackId = null;
            this.label = label;
            this.action = action;
        }

        public void Execute() {
            action.Invoke();
        }
    }
}
