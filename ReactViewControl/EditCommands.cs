namespace ReactViewControl {

    public class EditCommands {

        private IViewTransport Transport { get; }

        internal EditCommands(IViewTransport transport) {
            Transport = transport;
        }

        public void Cut() => Transport.ExecuteEditCommand(EditCommand.Cut);

        public void Copy() => Transport.ExecuteEditCommand(EditCommand.Copy);

        public void Paste() => Transport.ExecuteEditCommand(EditCommand.Paste);

        public void SelectAll() => Transport.ExecuteEditCommand(EditCommand.SelectAll);

        public void Undo() => Transport.ExecuteEditCommand(EditCommand.Undo);

        public void Redo() => Transport.ExecuteEditCommand(EditCommand.Redo);

        public void Delete() => Transport.ExecuteEditCommand(EditCommand.Delete);
    }
}
