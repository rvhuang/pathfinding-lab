namespace Heuristic.PathfindingLab.Models
{
    public class ResponseBody<T> where T : class
    {
        public T Data { get; set; }

        public ResponseError[] Errors { get; set; }
    }

    public class ResponseError
    {
        public int Code { get; set; }

        public string Message { get; set; }
    }
}
