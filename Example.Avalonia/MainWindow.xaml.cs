using System;
using System.Collections;
using System.Reactive;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Markup.Xaml;
using ReactiveUI;
using WebViewControl;

namespace Example.Avalonia {

    internal class MainWindow : Window {

        private TabControl tabs;

        public MainWindow() {
            WebView.Settings.OsrEnabled = false;
            InitializeComponent();

            CutCommand = ReactiveCommand.Create(() => {
                SelectedView.EditCommands.Cut();
            });

            CopyCommand = ReactiveCommand.Create(() => {
                SelectedView.EditCommands.Copy();
            });

            PasteCommand = ReactiveCommand.Create(() => {
                SelectedView.EditCommands.Paste();
            });

            UndoCommand = ReactiveCommand.Create(() => {
                SelectedView.EditCommands.Undo();
            });

            RedoCommand = ReactiveCommand.Create(() => {
                SelectedView.EditCommands.Redo();
            });

            SelectAllCommand = ReactiveCommand.Create(() => {
                SelectedView.EditCommands.SelectAll();
            });

            DeleteCommand = ReactiveCommand.Create(() => {
                SelectedView.EditCommands.Delete();
            });

            CreateTab();
        }

        private void InitializeComponent() {
            AvaloniaXamlLoader.Load(this);

            tabs = this.FindControl<TabControl>("tabs");
        }

        public void CreateTab() {
            ((IList)tabs.Items).Add(new TabItem() {
                Header = "View " + tabs.ItemCount,
                Content = new View()
            });
        }

        private View SelectedView => (View) tabs.SelectedContent;

        private void OnNewTabClick(object sender, RoutedEventArgs e) {
            CreateTab();
        }

        private void OnCallMainViewMenuItemClick(object sender, RoutedEventArgs e) {
            SelectedView.CallMainViewMenuItemClick();
        }

        private void OnCallInnerViewMenuItemClick(object sender, RoutedEventArgs e) {
            SelectedView.CallInnerViewMenuItemClick();
        }

        private void OnCallInnerViewPluginMenuItemClick(object sender, RoutedEventArgs e) {
            SelectedView.CallInnerViewPluginMenuItemClick();
        }

        private void OnToggleDefaultStyleSheetMenuItemClick(object sender, RoutedEventArgs e) {
            Settings.IsBorderLessPreference = !Settings.IsBorderLessPreference;
        }

        private void OnShowDevTools(object sender, RoutedEventArgs e) {
            SelectedView.ShowDevTools();
        }

        private void OnToggleIsEnabled(object sender, RoutedEventArgs e) {
            SelectedView.ToggleIsEnabled();
        }

        public ReactiveCommand<Unit, Unit> CutCommand { get; }

        public ReactiveCommand<Unit, Unit> CopyCommand { get; }

        public ReactiveCommand<Unit, Unit> PasteCommand { get; }

        public ReactiveCommand<Unit, Unit> UndoCommand { get; }

        public ReactiveCommand<Unit, Unit> RedoCommand { get; }

        public ReactiveCommand<Unit, Unit> SelectAllCommand { get; }

        public ReactiveCommand<Unit, Unit> DeleteCommand { get; }
    }
}