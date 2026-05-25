const REPORT_TYPES = {
  CSV: 'CSV',
  HTML: 'HTML',
};

const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
};

const STANDARD_USER_MAX_VALUE = 500;
const PRIORITY_MIN_VALUE = 1000;

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  generateReport(reportType, user, items) {
    const visibleItems = this.getVisibleItems(user, items);
    const total = this.calculateTotal(visibleItems);

    return [
      this.buildHeader(reportType, user),
      this.buildBody(reportType, user, visibleItems),
      this.buildFooter(reportType, total),
    ].join('').trim();
  }

  getVisibleItems(user, items) {
    if (user.role === USER_ROLES.ADMIN) {
      return items;
    }

    if (user.role === USER_ROLES.USER) {
      return items.filter((item) => item.value <= STANDARD_USER_MAX_VALUE);
    }

    return [];
  }

  calculateTotal(items) {
    return items.reduce((total, item) => total + item.value, 0);
  }

  buildHeader(reportType, user) {
    const headers = {
      [REPORT_TYPES.CSV]: () => 'ID,NOME,VALOR,USUARIO\n',
      [REPORT_TYPES.HTML]: () => [
        '<html><body>\n',
        '<h1>Relatório</h1>\n',
        `<h2>Usuário: ${user.name}</h2>\n`,
        '<table>\n',
        '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n',
      ].join(''),
    };

    return this.resolveRenderer(headers, reportType);
  }

  buildBody(reportType, user, items) {
    return items
      .map((item) => this.buildItemLine(reportType, user, item))
      .join('');
  }

  buildItemLine(reportType, user, item) {
    const renderers = {
      [REPORT_TYPES.CSV]: () => this.buildCsvItemLine(user, item),
      [REPORT_TYPES.HTML]: () => this.buildHtmlItemLine(user, item),
    };

    return this.resolveRenderer(renderers, reportType);
  }

  buildCsvItemLine(user, item) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  buildHtmlItemLine(user, item) {
    const style = this.getPriorityStyle(user, item);

    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  getPriorityStyle(user, item) {
    if (user.role === USER_ROLES.ADMIN && item.value > PRIORITY_MIN_VALUE) {
      return ' style="font-weight:bold;"';
    }

    return '';
  }

  buildFooter(reportType, total) {
    const footers = {
      [REPORT_TYPES.CSV]: () => `\nTotal,,\n${total},,\n`,
      [REPORT_TYPES.HTML]: () => `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`,
    };

    return this.resolveRenderer(footers, reportType);
  }

  resolveRenderer(renderers, reportType) {
    const renderer = renderers[reportType];

    return renderer ? renderer() : '';
  }
}
