from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal

class ReglaEvaluable(BaseModel):
    """DTO puro para alimentar el motor."""
    id_version: str
    clave_regla: str
    logica: Dict[str, Any]
    template_error: str
    prioridad: int
    severidad: Literal['INFO', 'WARNING', 'ERROR', 'BLOCKER']
    
class ResultadoEvaluacion(BaseModel):
    es_valido: bool
    score_cumplimiento: float # 0.0 a 1.0
    errores: List[str]
    warnings: List[str]
    reglas_ejecutadas: int
