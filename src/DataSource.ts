import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { getTemplateSrv, getBackendSrv } from '@grafana/runtime';
import _ from 'lodash';
import defaults from 'lodash/defaults';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  baseUrl: string;
  requestDebounce: any;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.baseUrl = instanceSettings.url!;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      const query = defaults(target, defaultQuery);
      if (query.hide) {
        return {
          data: [],
        };
      }

      const response = await this.request(getTemplateSrv().replace(query.queryText, options.scopedVars));
      return new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Data', type: FieldType.other, values: response},
        ],
      });
    });

    return Promise.all(promises).then((data) => ({ data }));
  }

  async request(query: string) {
    return getBackendSrv().post(`${this.baseUrl}/api/topology`, `{"GremlinQuery": "${query}"}`);
  }

  async requestGet(url: string, params?: string) {
    return getBackendSrv().datasourceRequest({
      url: `${this.baseUrl}${url}${params?.length ? `?${params}` : ''}`,
    });
  }

  /**
   * Checks whether we can connect to the API.
   */
  async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to API';

    try {
      const response = await this.requestGet('/api');
      if (response.status === 200) {
        return {
          status: 'success',
          message: 'Success',
        };
      } else {
        return {
          status: 'error',
          message: response.statusText ? response.statusText : defaultErrorMessage,
        };
      }
    } catch (err) {
      if (_.isString(err)) {
        return {
          status: 'error',
          message: err,
        };
      } else {
        let message = '';
        message += err.statusText ? err.statusText : defaultErrorMessage;
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message;
        }

        return {
          status: 'error',
          message,
        };
      }
    }
  }
}
