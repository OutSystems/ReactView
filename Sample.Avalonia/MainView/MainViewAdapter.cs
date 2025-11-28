using ReactViewControl;

namespace Sample.Avalonia;

partial class MainView {
    private uint counter;
    private string currentEditorViewName;

    public IViewModule ToggleEditorView() {
        if (counter == 0) {
            GetInnerViewName += () => currentEditorViewName;
        }

        var childViewName = "canvas-" + counter++;
        currentEditorViewName = childViewName;

        IViewModule view = counter % 2 == 0
            ? MainModule.GetOrAddChildView<TaskListViewModule>(childViewName)
            : MainModule.GetOrAddChildView<UsersViewModule>(childViewName);

        RefreshInnerView();
        return view;
    }
}