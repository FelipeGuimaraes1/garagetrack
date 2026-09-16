<!--
SYNC IMPACT REPORT:

Version change: NEW → 1.0.0

Modified principles:
- Added: I. Arquitetura e Separação de Responsabilidades
- Added: II. Segurança e Autorização por Propriedade
- Added: III. Integridade e Validação dos Dados
- Added: IV. Domínio Automotivo e Consistência das Regras de Negócio
- Added: V. Experiência do Usuário e Acessibilidade
- Added: VI. Performance e Uso Responsável de Recursos
- Added: VII. Evolução Incremental e Qualidade

Added sections:
- Core Principles
- Governance

Removed sections:
- None

Templates requiring updates:
- Constitution-driven templates: No changes required
- Feature, plan, and task templates: Principles are consumed by the
  Spec Kit workflow and do not require project-specific structural changes.

Follow-up TODOs:
- None
-->

# GarageTrack Constitution

## Core Principles

### I. Arquitetura e Separação de Responsabilidades

O GarageTrack MUST manter uma arquitetura modular e organizada, com responsabilidades claramente separadas entre interface, regras de negócio, validação, autenticação, segurança e persistência de dados.

Novas funcionalidades MUST respeitar a estrutura existente do projeto e MUST evitar a concentração excessiva de responsabilidades em componentes, páginas ou rotas de API.

Server Components MUST ser utilizados por padrão no App Router. Client Components MUST ser utilizados quando houver necessidade real de interatividade no cliente, estado local, APIs do navegador ou outros recursos exclusivamente client-side.

A introdução de novas camadas arquiteturais MUST ser justificada pela complexidade real do domínio e MUST NOT ocorrer apenas por antecipação de problemas futuros.

**Rationale:** O GarageTrack não possui atualmente uma camada formal de Services ou DAL. A arquitetura deve evoluir conforme a complexidade real da aplicação, evitando tanto o acoplamento excessivo quanto a criação prematura de abstrações.

### II. Segurança e Autorização por Propriedade

Segurança MUST ser tratada como requisito fundamental de todas as funcionalidades.

Toda operação protegida MUST verificar a autenticação do usuário e, quando o recurso pertencer a um usuário específico, MUST verificar sua autorização sobre aquele recurso.

A identificação de um recurso por ID MUST NOT ser considerada suficiente para autorizar sua leitura, alteração ou remoção.

Consultas e operações de persistência MUST aplicar o contexto do usuário autenticado sempre que o domínio exigir isolamento entre usuários.

Dados provenientes do cliente MUST ser considerados não confiáveis e MUST ser validados antes de serem utilizados em operações sensíveis ou persistidos.

Operações suscetíveis a abuso MUST possuir mecanismos de proteção proporcionais ao ambiente de execução, incluindo limitação de requisições quando apropriado.

Segredos, credenciais e informações sensíveis MUST NOT ser expostos ao cliente ou armazenados diretamente no código-fonte.

**Rationale:** O GarageTrack é uma aplicação multiusuário. Veículos, despesas e lembretes possuem relação com usuários, tornando o isolamento de dados e a autorização requisitos funcionais e não apenas preocupações de infraestrutura.

### III. Integridade e Validação dos Dados

Os dados recebidos pela aplicação MUST ser validados antes de alcançarem as operações de persistência.

O GarageTrack MUST utilizar schemas de validação explícitos para dados de entrada, mantendo regras de domínio próximas às estruturas que representam essas regras.

As validações MUST possuir mensagens compreensíveis quando forem apresentadas ao usuário.

Dados financeiros, quilometragem e outros valores que possam sofrer perda de precisão MUST utilizar representações apropriadas ao domínio, evitando cálculos baseados exclusivamente em `number` quando a precisão decimal for relevante.

Regras condicionais do domínio MUST ser validadas explicitamente. Por exemplo, despesas de abastecimento MUST possuir os dados específicos necessários para representar um abastecimento válido.

**Rationale:** O projeto utiliza Zod para validação e Prisma.Decimal para valores financeiros e de quilometragem. Essas decisões protegem a integridade dos dados e devem permanecer como parte da arquitetura do domínio.

### IV. Domínio Automotivo e Consistência das Regras de Negócio

As regras relacionadas a veículos, despesas, quilometragem e lembretes MUST preservar a consistência do histórico e do estado atual do veículo.

Operações que alterem informações derivadas ou relacionadas ao veículo MUST considerar os dados já existentes antes de modificá-los.

O hodômetro, por representar uma progressão física do veículo, MUST NOT ser reduzido por uma operação comum do sistema.

Lembretes baseados em quilometragem ou tempo MUST utilizar referências coerentes com o estado atual do veículo e MUST manter uma distinção clara entre configuração do lembrete, última execução e próxima condição de vencimento.

Regras de negócio MUST ser implementadas de maneira explícita e previsível, evitando comportamentos implícitos que possam alterar silenciosamente o histórico do usuário.

**Rationale:** O GarageTrack não é apenas um CRUD genérico. O relacionamento entre hodômetro, despesas e lembretes constitui parte importante do domínio da aplicação e deve preservar a consistência histórica dos dados.

### V. Experiência do Usuário e Acessibilidade

Novas funcionalidades MUST priorizar uma experiência clara, previsível e consistente para o usuário.

Mensagens de erro, estados vazios, carregamento, confirmação de operações e resultados de ações MUST possuir comportamento compreensível.

Interfaces MUST respeitar os padrões visuais e de interação já estabelecidos no aplicativo, evitando comportamentos diferentes para funcionalidades equivalentes.

Dados apresentados ao usuário MUST respeitar o contexto brasileiro do GarageTrack, incluindo formatos apropriados de datas, valores monetários, quilometragem e mensagens em português do Brasil.

A acessibilidade MUST ser considerada durante a implementação, incluindo uso adequado de elementos semânticos, controles identificáveis e feedback compreensível.

**Rationale:** O GarageTrack possui usuários brasileiros como público-alvo e já possui decisões específicas de localização e UX. A consistência entre telas torna-se progressivamente mais importante conforme novas funcionalidades são adicionadas.

### VI. Performance e Uso Responsável de Recursos

Operações que possam retornar grandes quantidades de dados MUST possuir limites previsíveis.

Listagens MUST utilizar paginação quando o volume de dados puder crescer significativamente.

Exportações e operações potencialmente custosas MUST possuir limites apropriados para evitar consumo excessivo de memória, processamento ou recursos do banco de dados.

Consultas ao banco MUST solicitar apenas os dados necessários para cada operação sempre que isso puder reduzir processamento ou transferência desnecessários.

Operações independentes SHOULD ser executadas de forma concorrente quando isso melhorar o desempenho sem comprometer a consistência dos dados.

**Rationale:** O projeto já possui limites explícitos para paginação e exportação. Este princípio estabelece a necessidade de controlar o consumo de recursos sem transformar os valores atuais, como 50 registros por página ou 5.000 registros por exportação, em regras arquiteturais permanentes.

### VII. Evolução Incremental e Qualidade

O GarageTrack MUST evoluir de maneira incremental, priorizando soluções simples que atendam às necessidades reais do produto.

Novas funcionalidades SHOULD reutilizar abstrações e padrões existentes quando apropriado, evitando duplicação desnecessária.

Mudanças arquiteturais significativas MUST ser justificadas pela necessidade concreta do projeto.

Alterações MUST preservar funcionalidades existentes e considerar seus efeitos sobre autenticação, autorização, banco de dados, validação e experiência do usuário.

Antes de considerar uma funcionalidade concluída, DEVEM ser realizados testes adequados ao risco e à natureza da alteração, incluindo validação manual quando aplicável e testes automatizados quando a complexidade justificar sua inclusão.

**Rationale:** O GarageTrack está em evolução contínua. O objetivo é construir uma aplicação sólida que possa crescer sem acumular complexidade desnecessária, e não antecipar uma arquitetura para um sistema muito maior do que as necessidades atuais.

## Governance

Esta Constitution constitui a referência fundamental para especificação, planejamento, implementação e revisão de funcionalidades do GarageTrack.

Quando uma nova funcionalidade entrar em conflito com um princípio desta Constitution, o conflito MUST ser identificado explicitamente antes da implementação.

Alterações nesta Constitution MUST ser deliberadas e justificadas. Uma alteração MUST explicar seu motivo, seu impacto sobre o projeto e, quando necessário, quais partes existentes precisam ser adaptadas.

Esta Constitution utiliza versionamento semântico:

- **MAJOR:** remoção ou redefinição incompatível de princípios ou regras fundamentais.
- **MINOR:** adição de um novo princípio ou expansão material de uma regra existente.
- **PATCH:** esclarecimentos, correções de redação ou refinamentos semânticos que não alterem as obrigações fundamentais.

O cumprimento dos princípios MUST ser considerado durante a especificação, planejamento, implementação e revisão de cada funcionalidade.

Detalhes específicos de implementação, convenções de código e instruções operacionais DEVEM permanecer nas Cursor Rules ou na documentação técnica apropriada, evitando duplicação entre os mecanismos de governança do projeto.

Qualquer desvio de um princípio MUST ser explicitamente identificado, justificado e avaliado antes da implementação.

**Version:** 1.0.0 | **Ratified:** 2026-09-15 | **Last Amended:** 2026-09-15