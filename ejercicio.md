# Ejercicio 3: Modelo de Colas M/M/2 - Farmacia

Este documento contiene la resolución detallada y las fórmulas aplicadas para el análisis del sistema de atención de la farmacia.

## 1. Datos del Sistema
* **Tasa de llegada ($\lambda$):** 18 clientes/hora
* **Tasa de servicio por cajero ($\mu$):** 12 clientes/hora
* **Número de servidores ($s$):** 2 (inicialmente)

---

## 2. Ecuaciones Utilizadas (Modelo M/M/s)

### Utilización del Sistema ($\rho$)
$$\rho = \frac{\lambda}{s \cdot \mu}$$

### Probabilidad de Sistema Vacío ($P_0$)
$$P_0 = \left[ \sum_{n=0}^{s-1} \frac{(\lambda/\mu)^n}{n!} + \frac{(\lambda/\mu)^s}{s! (1 - \rho)} \right]^{-1}$$

### Probabilidad de Espera (Erlang-C)
$$C(s, \lambda/\mu) = \frac{(\lambda/\mu)^s}{s!(1-\rho)} \cdot P_0$$

### Medidas de Desempeño
* **Clientes en cola:** $L_q = C(s, \lambda/\mu) \cdot \frac{\rho}{1 - \rho}$
* **Tiempo en cola:** $W_q = \frac{L_q}{\lambda}$
* **Tiempo en el sistema:** $W = W_q + \frac{1}{\mu}$

---

## 3. Resultados Comparativos

| Variable | Descripción | Escenario $s=2$ | Escenario $s=3$ |
| :--- | :--- | :--- | :--- |
| **$\rho$** | Utilización | 0.75 (75%) | 0.50 (50%) |
| **$P_0$** | Prob. sistema vacío | 0.1429 | 0.2105 |
| **$L_q$** | Clientes en cola | 1.9286 | 0.2368 |
| **$W_q$ (min)** | Tiempo espera cola | 6.43 min | 0.79 min |
| **$W$ (min)** | Tiempo total sistema | 11.43 min | 5.79 min |

---

## 4. Conclusiones
Al incrementar de 2 a 3 cajeros:
1.  La **utilización** baja del 75% al 50%, lo que reduce el estrés del sistema.
2.  El **tiempo de espera en cola ($W_q$)** disminuye drásticamente en un **87.7%** (de ~6.4 min a menos de 1 min).
3.  El sistema se vuelve significativamente más eficiente para el cliente, aunque los cajeros estarán ociosos la mitad del tiempo.