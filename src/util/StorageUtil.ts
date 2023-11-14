export class StorageUtil {

    public static localData: any;
    public static load<T>(dataTable: string): T {
        let jsonData = localStorage.getItem(dataTable);
        if (jsonData) {
            this.localData = JSON.parse(jsonData);
        } else {
            this.localData = {};
            StorageUtil.save(dataTable, this.localData);
        }
        return this.localData as T;
    }

    public static save<T>(table: string, data: T) {
        let json = JSON.stringify(data)
        localStorage.setItem(table, json);
    }
} 