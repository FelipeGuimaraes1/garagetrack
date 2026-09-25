# Feature Specification: Editar Despesa Existente

**Feature Branch**: `[001-edit-expense]`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "Adicionar a possibilidade de editar uma despesa existente no GarageTrack. O usuário autenticado deve conseguir editar apenas despesas pertencentes a ele. A edição deve permitir alterar os dados que atualmente podem ser informados no cadastro da despesa, respeitando as regras de negócio existentes para cada tipo de despesa. A funcionalidade deve preservar a integridade do histórico do veículo, especialmente em relação ao odômetro. A edição de uma despesa não deve permitir que o odômetro atual do veículo seja reduzido ou alterado de maneira inconsistente. A validação dos dados deve seguir os schemas e padrões existentes no projeto. A interface deve seguir os padrões visuais e de interação já utilizados no GarageTrack, incluindo estados de carregamento, erros de validação, confirmação quando necessária e feedback após uma alteração bem-sucedida. Caso a despesa possua anexos, a edição deve respeitar o comportamento atual de anexos e não deve causar perda acidental de arquivos. A solução deve considerar autenticação, autorização por propriedade, validação, persistência, regras relacionadas ao veículo e atualização correta da interface após a edição. Não introduzir novas camadas arquiteturais ou tecnologias sem necessidade."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corrigir dados de uma despesa própria (Priority: P1)

Um usuário autenticado visualiza uma despesa que ele mesmo registrou, identifica um erro (por exemplo, valor, data, descrição, status, veículo ou tipo) e abre a edição. O formulário já aparece preenchido com os dados atuais. Ele altera os campos permitidos, salva e vê a despesa atualizada na lista, com confirmação de sucesso.

**Why this priority**: Sem esta jornada, o usuário não consegue corrigir o histórico financeiro do veículo e a funcionalidade não existe. É o valor principal da feature.

**Independent Test**: Pode ser testada criando uma despesa válida, abrindo a edição, alterando campos comuns (descrição, valor, data e status) e confirmando que a lista passa a exibir os novos dados.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com uma despesa própria visível na lista, **When** ele abre a edição, **Then** o formulário é apresentado com os dados atuais da despesa já preenchidos.
2. **Given** o formulário de edição aberto com dados válidos, **When** o usuário altera campos permitidos e salva, **Then** a despesa é persistida com os novos valores e a lista é atualizada sem exigir recarregar a página manualmente.
3. **Given** o formulário de edição aberto, **When** o usuário cancela ou fecha a edição sem salvar, **Then** nenhum dado da despesa é alterado.
4. **Given** uma edição bem-sucedida, **When** a operação termina, **Then** o usuário recebe um feedback claro de sucesso em português do Brasil.

---

### User Story 2 - Impedir edição de despesas de outras pessoas (Priority: P1)

Um usuário autenticado só pode alterar despesas que lhe pertencem. Tentativas de editar uma despesa de outro usuário, ou de editar sem estar autenticado, são recusadas. A posse do identificador da despesa não é suficiente para autorizar a alteração.

**Why this priority**: Isolamento entre usuários é requisito constitucional de segurança. Sem esta proteção, a correção de despesas se torna um risco de acesso indevido a dados de terceiros.

**Independent Test**: Pode ser testada tentando alterar uma despesa existente sem autenticação e tentando alterar uma despesa de outro usuário; ambas as tentativas devem ser recusadas sem revelar o conteúdo do registro.

**Acceptance Scenarios**:

1. **Given** um visitante não autenticado, **When** ele tenta alterar uma despesa existente, **Then** a operação é recusada e nenhum dado é modificado.
2. **Given** um usuário autenticado, **When** ele tenta alterar uma despesa que pertence a outro usuário, **Then** a operação é recusada como se a despesa não existisse para ele e os dados originais permanecem intactos.
3. **Given** um usuário autenticado, **When** ele tenta editar uma despesa que não existe, **Then** a operação é recusada sem expor detalhes internos.
4. **Given** um usuário autenticado editando a própria despesa, **When** ele tenta associá-la a um veículo que não lhe pertence, **Then** a alteração é recusada e a despesa permanece no veículo original.

---

### User Story 3 - Preservar o odômetro atual do veículo (Priority: P1)

Ao editar uma despesa, o usuário pode informar ou ajustar a quilometragem relacionada, mas isso não pode reduzir o odômetro atual do veículo nem reescrever o histórico de forma inconsistente. O odômetro atual só avança quando o valor informado for maior do que o valor atual; valores menores ou iguais não o alteram.

**Why this priority**: O odômetro representa a progressão física do veículo. Uma correção de despesa que diminua o odômetro atual corrompe o histórico e afeta lembretes e consultas futuras.

**Independent Test**: Pode ser testada editando uma despesa com um valor de odômetro menor, igual e maior do que o odômetro atual do veículo, e conferindo que o odômetro do veículo nunca diminui.

**Acceptance Scenarios**:

1. **Given** um veículo com odômetro atual conhecido, **When** o usuário salva uma edição informando um odômetro maior do que o atual, **Then** o odômetro atual do veículo é atualizado para esse valor maior.
2. **Given** um veículo com odômetro atual conhecido, **When** o usuário salva uma edição informando um odômetro menor ou igual ao atual, **Then** o odômetro atual do veículo permanece inalterado e a despesa ainda pode ser salva se os demais dados forem válidos.
3. **Given** um usuário corrigindo apenas dados da despesa (valor, data, descrição ou status) sem informar um novo odômetro do veículo, **When** ele salva, **Then** o odômetro atual do veículo permanece o mesmo.
4. **Given** uma despesa transferida para outro veículo do mesmo usuário com um odômetro informado maior do que o do veículo de destino, **When** a edição é salva, **Then** apenas o odômetro do veículo de destino pode avançar; o odômetro do veículo de origem não é reduzido.

---

### User Story 4 - Respeitar regras por tipo de despesa (Priority: P2)

A edição permite os mesmos tipos de informação do cadastro. Campos específicos de abastecimento só se aplicam a esse tipo. Se o usuário mudar o tipo, as regras desse novo tipo passam a valer. Dados incompatíveis com o tipo resultante não devem permanecer de forma inconsistente.

**Why this priority**: Uma despesa inválida para o tipo escolhido quebra relatórios, consumo e o histórico do veículo. A edição precisa ser tão consistente quanto o cadastro.

**Independent Test**: Pode ser testada editando uma despesa de abastecimento com e sem os dados de combustível, e alterando o tipo de abastecimento para outro tipo, verificando que as regras de cada tipo são aplicadas.

**Acceptance Scenarios**:

1. **Given** uma despesa cujo tipo resultante é abastecimento, **When** o usuário tenta salvar sem os dados obrigatórios de combustível já exigidos no cadastro, **Then** a edição é recusada e os erros são apresentados de forma compreensível junto aos campos correspondentes.
2. **Given** uma despesa de abastecimento com dados de combustível preenchidos, **When** o usuário altera o tipo para um tipo que não é abastecimento e salva, **Then** os dados específicos de combustível não permanecem associados à despesa.
3. **Given** uma despesa que não é de abastecimento, **When** o usuário a altera para abastecimento, **Then** os campos específicos de combustível passam a ser exigidos antes de salvar.
4. **Given** qualquer tipo de despesa, **When** o usuário informa valor, data, descrição e demais campos comuns, **Then** as mesmas regras de validação do cadastro são aplicadas (limites, formatos e obrigatoriedades equivalentes ao contexto da edição).

---

### User Story 5 - Preservar anexos e receber feedback claro (Priority: P2)

Se a despesa já possui comprovantes ou outros anexos, a edição dos dados da despesa não remove nem substitui esses arquivos. A interface segue o padrão visual e de interação já usado no GarageTrack, com carregamento, erros de validação e feedback de sucesso. Confirmação aparece apenas quando a ação for destrutiva ou irreversível segundo os padrões já adotados no produto.

**Why this priority**: Perder um comprovante ao corrigir um valor é um dano grave para o usuário. Feedback inconsistente também impede que ele confie na correção.

**Independent Test**: Pode ser testada editando uma despesa com anexos e verificando que os arquivos continuam disponíveis depois do salvamento, além de observar loading, erro de validação e mensagem de sucesso.

**Acceptance Scenarios**:

1. **Given** uma despesa própria com um ou mais anexos, **When** o usuário altera dados da despesa e salva com sucesso, **Then** todos os anexos existentes permanecem associados à despesa, com os mesmos arquivos.
2. **Given** o usuário enviando o formulário de edição, **When** a gravação está em andamento, **Then** a interface indica o estado de carregamento e impede envios duplicados.
3. **Given** dados inválidos no formulário, **When** o usuário tenta salvar, **Then** a despesa não é alterada e mensagens de validação compreensíveis são exibidas em português do Brasil.
4. **Given** uma falha inesperada ao salvar, **When** a operação não se completa, **Then** o usuário recebe um aviso de erro compreensível, sem detalhes internos, e os dados anteriores são preservados.

---

### Edge Cases

- O que acontece se a despesa for excluída por outra sessão enquanto o formulário de edição ainda está aberto?
- Como o sistema trata um identificador de despesa inválido ou inexistente?
- O que acontece se o usuário informar odômetro vazio na edição?
- O que acontece se o usuário informar odômetro menor do que o odômetro atual do veículo?
- Como o sistema trata a mudança de veículo da despesa para outro veículo do mesmo usuário?
- Como o sistema trata a tentativa de mover a despesa para um veículo de outra pessoa?
- O que acontece ao mudar o tipo de abastecimento para outro tipo, e o contrário?
- Como o sistema trata valores monetários e de quilometragem com precisão decimal, zeros, vazios ou formatos inválidos?
- O que acontece se a despesa tiver o número máximo de anexos já associado e o usuário apenas editar os demais dados?
- Como a interface se comporta se o usuário fechar o fluxo de edição durante o carregamento?
- O que acontece se dois salvamentos da mesma despesa ocorrerem em sequência rápida?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um usuário autenticado inicie a edição de uma despesa que lhe pertence a partir da listagem de despesas.
- **FR-002**: O sistema MUST recusar qualquer tentativa de edição feita por um usuário não autenticado.
- **FR-003**: O sistema MUST autorizar a edição somente quando a despesa pertencer ao usuário autenticado; a posse do identificador da despesa MUST NOT ser suficiente para autorizar a alteração.
- **FR-004**: Quando a despesa não existir ou não pertencer ao usuário autenticado, o sistema MUST recusar a operação sem revelar se o registro existe para outra pessoa.
- **FR-005**: O formulário de edição MUST apresentar os dados atuais da despesa e MUST permitir alterar os mesmos dados de negócio informáveis no cadastro, com exceção da gestão de anexos, que permanece fora do escopo desta feature.
- **FR-006**: Os dados enviados na edição MUST ser validados segundo as mesmas regras de negócio e de integridade já usadas no cadastro de despesas, incluindo regras condicionais por tipo, antes de qualquer gravação.
- **FR-007**: Verificações feitas na tela MAY melhorar a experiência, mas MUST NOT ser consideradas suficientes para gravar a alteração.
- **FR-008**: Se o tipo resultante da despesa for abastecimento, o sistema MUST exigir os dados específicos de combustível já obrigatórios no cadastro.
- **FR-009**: Se o tipo resultante deixar de ser abastecimento, o sistema MUST remover os dados específicos de combustível da despesa para evitar inconsistência.
- **FR-010**: O usuário MAY alterar o veículo associado à despesa somente para outro veículo que lhe pertença.
- **FR-011**: O odômetro atual do veículo MUST NOT ser reduzido nem zerado como efeito da edição de uma despesa.
- **FR-012**: Se a edição informar um odômetro do veículo maior do que o odômetro atual, o sistema MUST atualizar o odômetro atual para esse valor maior.
- **FR-013**: Se a edição omitir o odômetro do veículo, ou informar um valor menor ou igual ao atual, o sistema MUST preservar o odômetro atual do veículo.
- **FR-014**: A correção da quilometragem registrada na própria despesa MUST NOT reescrever de forma silenciosa o odômetro atual do veículo para um valor menor.
- **FR-015**: Valores monetários e de quilometragem MUST ser tratados com representação adequada à precisão do domínio, sem perda de exatidão causada por arredondamentos inadequados.
- **FR-016**: A edição dos dados da despesa MUST preservar todos os anexos já associados; a operação MUST NOT remover, substituir ou desvincular arquivos existentes.
- **FR-017**: Esta feature MUST NOT incluir inclusão, substituição ou exclusão de anexos durante a edição.
- **FR-018**: Após uma edição bem-sucedida, o sistema MUST persistir os novos dados e MUST atualizar a interface para refletir a despesa corrigida, incluindo listagens e informações do veículo que dependam do odômetro quando ele tiver avançado.
- **FR-019**: A interface de edição MUST seguir os padrões visuais e de interação já utilizados no GarageTrack, incluindo estados de carregamento, erros de validação, feedback de sucesso e confirmação apenas quando a ação for destrutiva ou irreversível segundo o padrão já adotado.
- **FR-020**: Mensagens apresentadas ao usuário MUST estar em português do Brasil e MUST usar convenções brasileiras para datas, valores monetários e quilometragem.
- **FR-021**: Controles da edição MUST ser identificáveis, utilizáveis por teclado e MUST apresentar feedback compreensível de erro e de progresso.
- **FR-022**: O sistema MUST impedir envios duplicados enquanto uma gravação estiver em andamento.
- **FR-023**: A experiência de edição MUST ser consistente com o cadastro e a listagem de despesas já existentes, sem exigir um fluxo ou conceito de produto diferente para corrigir um registro.
- **FR-024**: A edição MUST preservar o restante do histórico do veículo: não MUST recalcular nem reduzir o odômetro atual com base em outras despesas, nem alterar silenciosamente registros históricos não editados pelo usuário.

### Key Entities

- **Usuário autenticado**: Pessoa dona das despesas e dos veículos. Toda edição ocorre no contexto desse usuário.
- **Despesa**: Registro de um gasto associado a um veículo e a um usuário. Possui tipo, status, data, valor, descrição, quilometragem opcional da despesa e, quando for abastecimento, dados de combustível.
- **Veículo**: Bem ao qual a despesa pertence. Possui odômetro atual, que representa a quilometragem acumulada e não pode diminuir por uma edição comum de despesa.
- **Anexo da despesa**: Comprovante ou arquivo já associado à despesa. Nesta feature, o anexo é somente preservado.
- **Tipo de despesa**: Classificação que determina quais campos são obrigatórios ou devem ser limpos (por exemplo, abastecimento exige dados de combustível).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário autenticado consegue abrir, corrigir e salvar uma despesa própria em menos de 2 minutos para alterações simples (descrição, valor, data ou status).
- **SC-002**: 100% das tentativas de editar uma despesa de outro usuário ou sem autenticação são recusadas, e nenhum dado da despesa alvo é modificado.
- **SC-003**: Em 100% das edições, o odômetro atual do veículo envolvido termina igual ou maior do que estava antes da operação; nunca menor.
- **SC-004**: 100% das despesas que já possuíam anexos mantêm a mesma quantidade e os mesmos arquivos após uma edição bem-sucedida dos demais dados.
- **SC-005**: Em pelo menos 95% das tentativas de salvar dados inválidos, o usuário recebe uma mensagem de validação compreensível antes ou no momento da recusa, sem perda dos dados já persistidos.
- **SC-006**: Após uma edição bem-sucedida, a listagem de despesas reflete os novos dados na mesma sessão, sem necessidade de o usuário iniciar uma nova visita à tela.
- **SC-007**: Pelo menos 90% dos usuários conseguem concluir uma correção simples na primeira tentativa, sem ajuda externa.

## Assumptions

- O público-alvo continua sendo o usuário brasileiro autenticado que já cadastra despesas no GarageTrack.
- A criação, a exclusão, a listagem, a filtragem e a exportação de despesas já existem e permanecem inalteradas, exceto pelo necessário para abrir e refletir a edição.
- Os campos editáveis são os mesmos dados de negócio do cadastro: veículo, tipo, status, data, valor, descrição, quilometragem da despesa, odômetro do veículo e, quando aplicável, dados de combustível.
- O odômetro do veículo é opcional na edição. Se não for informado, o odômetro atual do veículo permanece como está.
- Informar um odômetro menor ou igual ao atual não impede o salvamento da despesa, desde que os demais dados sejam válidos; o odômetro atual simplesmente não muda.
- Transferir a despesa para outro veículo do mesmo usuário é permitido. O odômetro do veículo de origem não é recalculado nem reduzido. O odômetro do destino só avança se um valor maior for informado.
- A gestão de anexos (enviar, substituir ou remover comprovantes) está fora do escopo. A edição apenas garante que anexos existentes não sejam perdidos.
- Esta feature não reabre o fluxo de criação de lembretes usado após o cadastro de manutenção. Se o odômetro do veículo avançar, o estado atual do veículo passa a ser a referência para cálculos de lembrete já existentes em outras telas.
- A edição não reconstrói o histórico de odômetro a partir de todas as despesas do veículo. O odômetro atual nunca regride por causa de uma correção pontual.
- Confirmação extra não é exigida para um salvamento comum. Confirmação continua reservada a ações destrutivas já existentes no produto, como a exclusão de despesa.
- A validação reutiliza as regras e os padrões já adotados no cadastro de despesas. Não há um conjunto novo de regras, apenas a aplicação dessas regras ao contexto de atualização.
- A implementação deve evoluir o fluxo já existente, sem criar camadas arquiteturais, bibliotecas ou padrões de interface novos sem necessidade.
- Datas, moeda e quilometragem seguem as convenções brasileiras já usadas no produto.
- Em caso de conflito entre o identificador apresentado e a despesa realmente pertencente ao usuário, prevalece a verificação de propriedade do usuário autenticado.
