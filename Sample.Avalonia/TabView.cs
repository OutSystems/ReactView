using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives.PopupPositioning;
using Avalonia.Styling;
using Avalonia.Threading;
using Avalonia.VisualTree;
using Avalonia.Layout;
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
            // window
            
            Dispatcher.UIThread.Post(() => {
                var window = new PopupWindow();
                var aiView = new AIContextSuggestionsMenuView();

                aiView.GetMenuEntries += () => {
                    return new MenuEntriesList() {
                        entries = new MenuEntry[] {
                            new MenuEntry() { actionKey = "1",icon = "", isHighlighted = false, kind = "", label = "First", tooltip = "tooltip1" },
                            new MenuEntry() { actionKey = "2",icon = "", isHighlighted = false, kind = "", label = "Second", tooltip = "tooltip2" },
                        }
                    };
                };
                aiView.WithPlugin<ViewPlugin>().NotifyViewLoaded += viewName => AppendLog(viewName + " loaded");
                
                window.Content = aiView;
                window.Opened += delegate {
                    Dispatcher.UIThread.InvokeAsync(() => {
                        aiView.Focus();
                    }, DispatcherPriority.Background);
                };
                window.ConfigurePosition(this, new Point(100, 100));

                window.ShowPopup();
            });
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


    public class PopupWindow : Window {

        private Window parent;
        private ManagedPopupPositioner positioner;
        private PopupPositionerParameters positionerParameters;

        public PopupWindow() {
            ShowInTaskbar = false;
            SystemDecorations = SystemDecorations.BorderOnly;
            //SizeToContent = SizeToContent.WidthAndHeight;
            //VerticalContentAlignment = VerticalAlignment.Top;
            //HorizontalContentAlignment = HorizontalAlignment.Left;
        }

        public void ConfigurePosition(IVisual target, Point offset, PopupAnchor anchor = PopupAnchor.TopLeft, PopupGravity gravity = PopupGravity.BottomRight) {
            var newParent = (Window)target.GetVisualRoot();

            if (newParent == null) {
                return;
            }

            if (parent != newParent) {
                parent = newParent;
                positioner = new ManagedPopupPositioner(new ManagedPopupPositionerPopupImplHelper(parent.PlatformImpl, MoveResizeDelegate));
            }

            positionerParameters = GetNewPositionerParametersRelativeToOffset(target, offset, anchor, gravity);

            if (positionerParameters.Size != default) {
                UpdatePosition();
            }
        }

        private PopupPositionerParameters GetNewPositionerParametersRelativeToOffset(IVisual target, Point offset, PopupAnchor anchor = PopupAnchor.TopLeft, PopupGravity gravity = PopupGravity.BottomRight) {
            var matrix = target.TransformToVisual(parent);
            if (matrix.HasValue) {
                var bounds = new Rect(default, target.Bounds.Size);
                var anchorRect = new Rect(offset, new Size(1, 1));

                var newpositionerParameters = new PopupPositionerParameters() {
                    ConstraintAdjustment = PopupPositionerConstraintAdjustment.All,
                    AnchorRectangle = anchorRect.Intersect(bounds).TransformToAABB(matrix.Value),
                    Anchor = anchor,
                    Gravity = gravity,
                    Size = positionerParameters.Size
                };

                return newpositionerParameters;
            }

            return positionerParameters;
        }

        private void MoveResizeDelegate(PixelPoint position, Size size, double scaling) {
            Position = position;
            Height = size.Height;
            Width = size.Width;
        }

        private void UpdatePosition() {
            positioner?.Update(positionerParameters);
        }

        protected override Size ArrangeOverride(Size finalSize) {
            positionerParameters.Size = finalSize;
            UpdatePosition();
            return base.ArrangeOverride(finalSize);
        }

        public void ShowPopup() {
            if (parent != null) {
                Show(parent);
            } else {
                Show();
            }
        }
    }
}
