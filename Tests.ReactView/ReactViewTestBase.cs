﻿using System;
using System.Threading.Tasks;

namespace Tests.ReactView {

    public abstract class ReactViewTestBase<T> : TestBase<T> where T : TestReactView, new() {

        protected override void InitializeView() {
            if (TargetView != null) {
                TargetView.UnhandledAsyncException += OnUnhandledAsyncException;
            }
            base.InitializeView();
        }

        protected override async Task AfterInitializeView() {
            await base.AfterInitializeView();
            if (AwaitReady) {
                await TargetView.AwaitReady();
            }
        }

        protected virtual bool AwaitReady => true;

        protected void WithUnhandledExceptionHandling(Action action, Func<Exception, bool> onException) {
            void OnUnhandledException(WebViewControl.UnhandledAsyncExceptionEventArgs e) {
                e.Handled = onException(e.Exception);
            }
            
            var failOnAsyncExceptions = FailOnAsyncExceptions;
            FailOnAsyncExceptions = false;
            TargetView.UnhandledAsyncException += OnUnhandledException;

            try {
                action();
            } finally {
                TargetView.UnhandledAsyncException -= OnUnhandledException;
                FailOnAsyncExceptions = failOnAsyncExceptions;
            }
        }

        protected override bool ShowDebugConsole() { 
            TargetView.ShowDeveloperTools();
            return true;
        }
    }

    public class ReactViewTestBase : ReactViewTestBase<TestReactView> {

        protected override TestReactView CreateView() {
            TestReactView.PreloadedCacheEntriesSize = 0; // disable cache during tests
            return base.CreateView();
        }
    }
}
