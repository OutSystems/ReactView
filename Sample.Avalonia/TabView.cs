using System;
using System.Collections.Generic;
using Avalonia.Controls;
using Avalonia.Styling;
using Avalonia.Threading;
using ReactViewControl;
using WebViewControl;

namespace Sample.Avalonia {

    internal class TabView : ContentControl, IStyleable {

        Type IStyleable.StyleKey => typeof(ContentControl);

        private MainView mainView;
        private TaskListViewModule taskListView;
        private int taskCounter;

        private readonly List<Task> taskList = new List<Task>() {
            new Task() { id = 0, text = "Learn react.js", isCompleted = true, user = "User1" },
            new Task() { id = 1, text = "Explore the ReactView framework", user = "User2" }
        };

        public TabView(int id) {
            taskCounter = taskList.Count;

            mainView = new MainView();
            mainView.TitleMessage = "Tasks List (" + id + ")";
            mainView.BackgroundKind = BackgroundKind.Image;
            mainView.AddTaskButtonClicked += OnMainViewAddTaskButtonClicked;
            mainView.GetTasksCount += () => taskList.Count;
            mainView.TaskListShown += () => taskListView.Load();
            mainView.WithPlugin<ViewPlugin>().NotifyViewLoaded += viewName => AppendLog(viewName + " loaded");

            taskListView = (TaskListViewModule)mainView.ListView;
            taskListView.GetTasks += () => taskList.ToArray();

            // this is an example of dynamic resources support
            taskListView.CustomResourceRequested += OnTaskListViewCustomResourceRequested;

            taskListView.WithPlugin<ViewPlugin>().NotifyViewLoaded += (viewName) => AppendLog(viewName + " loaded (child)");
            taskListView.Load();

            Content = mainView;
        }

        private void OnMainViewAddTaskButtonClicked(TaskCreationDetails taskDetails) {
            taskList.Add(new Task() {
                id = taskCounter++,
                text = taskDetails.text,
                user = "User1"
            });
            mainView.Refresh(); // refresh task counter
            taskListView.Refresh(); // refresh task list
            AppendLog("Added task: " + taskDetails.text);
        }

        public void ToggleHideCompletedTasks() => taskListView.ToggleHideCompletedTasks();

        public void ShowDevTools() => mainView.ShowDeveloperTools();

        public void ToggleIsEnabled() => mainView.IsEnabled = !mainView.IsEnabled;

        public ReactViewControl.EditCommands EditCommands => mainView.EditCommands;

        private void AppendLog(string log) {
            Dispatcher.UIThread.Post(() => {
                var status = this.FindControl<TextBox>("status");
                status.Text = DateTime.Now + ": " + log + Environment.NewLine + status.Text;
            });
        }

        private Resource OnTaskListViewCustomResourceRequested(string resourceKey, params string[] options) {
            return new Resource(ResourcesManager.GetResource(GetType().Assembly, new[] { "Users", resourceKey + ".png" }));
        }
    }
}
