﻿using System;
using System.IO;
using System.Windows;
using WebViewControl;

namespace Example {

    /// <summary>
    /// Interaction logic for ReactViewExample.xaml
    /// </summary>
    public partial class ReactViewExample : Window {

        private const string InnerViewName = "test";
        private int subViewCounter;

        private SubExampleViewModule subView;

        public ReactViewExample() {
            InitializeComponent();

            exampleView.WithPlugin<ViewPlugin>().NotifyViewLoaded += OnNotifyViewLoaded;

            exampleView.AddCustomResourceRequestedHandler(OnViewResourceRequested);
            exampleView.AddCustomResourceRequestedHandler(InnerViewName, OnInnerViewResourceRequested);
        }

        private MenuItem[] OnGetMenuItems() {
            void Execute(string label) {
                AppendLog($"Clicked on ${label} inside the React view");
            }
            return new[] {
                new MenuItem("Button 1", () => Execute("Button 1")),
                new MenuItem("Button 2", () => Execute("Button 2")),
            };
        }

        private SubMenuItem[] SubView_GetMenuItems() {
            void Execute(string label)
            {
                AppendLog($"Clicked on ${label} inside the React sub view");
            }
            return new[] {
                new SubMenuItem("Button 1", () => Execute("Button 1")),
                new SubMenuItem("Button 2", () => Execute("Button 2")),
            };
        }

        private void OnExampleViewClick(MenuItem menu) {
            menu.Execute();
        }

        private void OnCallMainViewMenuItemClick(object sender, RoutedEventArgs e) {
            exampleView.CallMe();
        }

        private void OnCallInnerViewMenuItemClick(object sender, RoutedEventArgs e) {
            subView.CallMe();
        }

        private void OnCallInnerViewPluginMenuItemClick(object sender, RoutedEventArgs e) {
            exampleView.WithPlugin<ViewPlugin>(InnerViewName).Test();
        }

        private void OnShowDevTools(object sender, RoutedEventArgs e) {
            exampleView.ShowDeveloperTools();
        }

        private string OnExampleViewGetTime() {
            return DateTime.Now.ToShortTimeString();
        }

        private void OnNotifyViewLoaded(string viewName) {
            AppendLog("On view loaded: " + viewName);
        }

        private void OnViewMounted() {
            var subViewId = subViewCounter++;
            subView = new SubExampleViewModule();
            subView.ConstantMessage = "This is a sub view";
            subView.GetTime += () => DateTime.Now.AddHours(1).ToShortTimeString() + $"(Id: {subViewId})";
            subView.GetMenuItems += SubView_GetMenuItems;
            exampleView.AttachInnerView(subView, InnerViewName);
            exampleView.WithPlugin<ViewPlugin>(InnerViewName).NotifyViewLoaded += (viewName) => AppendLog($"On sub view loaded (Id: {subViewId}): {viewName}");
            subView.CallMe();
        }

        private void AppendLog(string log) {
            Application.Current.Dispatcher.Invoke(() => status.Text = log + Environment.NewLine + status.Text);
        }

        private Stream OnViewResourceRequested(string resourceKey, params string[] options) {
            return ResourcesManager.GetResource(GetType().Assembly, new[] { "ExampleView", "ExampleView", resourceKey });
        }

        private Stream OnInnerViewResourceRequested(string resourceKey, params string[] options) {
            return ResourcesManager.GetResource(GetType().Assembly, new[] { "ExampleView", "SubExampleView", resourceKey });
        }
    }
}
