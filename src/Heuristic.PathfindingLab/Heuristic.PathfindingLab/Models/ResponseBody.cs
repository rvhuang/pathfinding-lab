namespace Heuristic.PathfindingLab.Models
{
    public class ResponseBody<T> where T : class
    {
        public T Data { get; set; }

        public ResponseError[] Errors { get; set; }
    }

    public class ResponseError
    {
        public static ResponseError InvalidFromAndGoalSettings => new ResponseError() { Code = 1, Message = "Invalid from And goal settings." };

        public int Code { get; set; }

        public string Message { get; set; }
    }
}
