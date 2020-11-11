using System.IO;

namespace ReactViewControl {

    public class Resource {

        public Resource(Stream content, string extension = null) {
            Content = content;
            Extension = extension;
        }

        public Stream Content { get; }

        public string Extension { get; }
    }
}
