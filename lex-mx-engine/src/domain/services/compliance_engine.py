import logging
from string import Template
from typing import Dict, Any, List
from json_logic import jsonLogic
from src.domain.schemas.compliance import ReglaEvaluable, ResultadoEvaluacion

# A. Logging Estructurado
logger = logging.getLogger("lex_mx.compliance_engine")

class ComplianceEngine:
    """
    Motor determinista puro. 
    Stateless: (Contexto + Reglas) -> Resultado
    """
    
    def evaluar(self, contexto: Dict[str, Any], reglas: List[ReglaEvaluable]) -> ResultadoEvaluacion:
        errores = []
        warnings = []
        reglas_ejecutadas = 0
        
        # B. Ordenar por prioridad (Las críticas primero para Fail-Fast si fuera necesario)
        reglas_ordenadas = sorted(reglas, key=lambda r: r.prioridad, reverse=True)
        
        logger.info(f"Iniciando evaluación de {len(reglas)} reglas.")
        
        for regla in reglas_ordenadas:
            try:
                # C. Ejecución de json-logic segura
                # TODO: Aquí iría la validación de schema JSON antes de ejecutar
                cumple = jsonLogic(regla.logica, contexto)
                
                reglas_ejecutadas += 1
                
                if not cumple:
                    # D. Interpolación Segura
                    mensaje = self._formatear_mensaje(regla.template_error, contexto)
                    
                    if regla.severidad in ['ERROR', 'BLOCKER']:
                        logger.debug(f"Regla fallida (BLOCKING): {regla.clave_regla}")
                        errores.append(mensaje)
                        # Opcional: Implementar Short-circuit aquí si es BLOCKER
                    else:
                        logger.debug(f"Regla fallida (WARNING): {regla.clave_regla}")
                        warnings.append(mensaje)
                        
            except Exception as e:
                # E. Manejo de Excepciones sin romper el flujo completo (o sí, según diseño)
                logger.error(f"Error crítico ejecutando regla {regla.clave_regla}: {str(e)}", exc_info=True)
                errores.append(f"Error de sistema en regla {regla.clave_regla}")

        es_valido = len(errores) == 0
        
        return ResultadoEvaluacion(
            es_valido=es_valido,
            score_cumplimiento=1.0 if es_valido else 0.0, # Simplificado
            errores=errores,
            warnings=warnings,
            reglas_ejecutadas=reglas_ejecutadas
        )

    def _formatear_mensaje(self, template_str: str, contexto: Dict) -> str:
        """Interpolación segura que no explota si falta una variable."""
        try:
            return Template(template_str).safe_substitute(contexto)
        except Exception:
            return template_str # Fallback seguro
