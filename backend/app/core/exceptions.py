class AppError(Exception):
    def __init__(
        self,
        message: str,
        *,
        status_code: int = 500,
        code: str = "internal_error"
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class PipelineExecutionError(AppError):
    def __init__(self, message: str = "AI pipeline execution failed") -> None:
        super().__init__(
            message,
            status_code=502,
            code="pipeline_execution_failed"
        )


class PipelineOutputError(AppError):
    def __init__(self, message: str = "AI pipeline returned invalid output") -> None:
        super().__init__(
            message,
            status_code=502,
            code="pipeline_output_invalid"
        )
