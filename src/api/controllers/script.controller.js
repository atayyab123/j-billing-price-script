const { Model } = require("objection");
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const metaFieldValueService = require("../services/metaFieldValue.service");

class controller {
  async priceUpdateSheetOne() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const csvFilePath = path.join(__dirname, '/../../..', 'files', 'ECP01317-Price update(Sheet1).csv');
        const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
        const json = Papa.parse(csvFileContent, {
          header: true, // if you want to treat the first line as headers
          skipEmptyLines: true,
        });
        const data = json.data;
        const uniqueServiceIds = [
          ...new Set(
            data.map(item => item['Service ID'].trim())
          )
        ];
        console.log('Unique Service IDs length:', uniqueServiceIds.length);
        const getRecords = await metaFieldValueService.getExistedRecords({ serviceIds: uniqueServiceIds }, trx);
        const findNoServiceIdArray = [];
        if (getRecords?.length > 0) {
          const remainingObjects = uniqueServiceIds.filter(
            obj => !getRecords.some(record => record.stringValue.includes(obj))
          );
          const filteredRemainingObjects = data.filter(obj => remainingObjects.includes(obj['Service ID'].trim()));
          if (filteredRemainingObjects && filteredRemainingObjects?.length > 0) findNoServiceIdArray.push(...filteredRemainingObjects);
          console.log('remainingObjects.length:', remainingObjects.length);
          console.log('getRecords.length:', getRecords.length);
          const stringValueCount = {};
          for (const item of getRecords) {
            const val = item.stringValue;
            stringValueCount[val] = (stringValueCount[val] || 0) + 1;
          }

          const duplicates = Object.keys(stringValueCount).filter(
            key => stringValueCount[key] > 1
          );

          console.log('duplicates:', duplicates);
        }
        const getModifiedRecords = getRecords && getRecords.length > 0
          ? JSON.parse(JSON.stringify(getRecords))
          : [];
        const findNoOrdersArray = [];
        const findNoItemsArray = [];
        if (getModifiedRecords?.length > 0) {
          for (const record of getModifiedRecords) {
            const serviceId = record?.stringValue?.trim();
            const findServiceId = data.filter(obj => obj['Service ID'].trim() === serviceId);
            if (findServiceId && findServiceId?.length > 0) {
              const order = record?.order;
              if (order) {
                const orderLine = order?.orderLine;
                if (orderLine && orderLine?.length > 0) {
                  for (const line of orderLine) {
                    const itemInternalNumber = line?.item?.internalNumber || null;
                    const findLineItem = findServiceId.filter(item => itemInternalNumber.startsWith(item['Product Code'].toString().trim()));
                    if (findLineItem && findLineItem?.length > 0) {
                      const price = parseFloat(findLineItem[0]['New Unit Price']);
                      const quantity = parseFloat(line.quantity);
                      const amount = quantity * price;
                      line.price = price.toFixed(10);
                      line.amount = amount.toFixed(10);
                    }
                  }
                }
                const remainingOrderLine = findServiceId.filter(
                  item => !orderLine.some(line => line?.item?.internalNumber.startsWith(item['Product Code'].toString().trim()))
                );
                if (remainingOrderLine && remainingOrderLine?.length > 0) findNoItemsArray.push(...remainingOrderLine);
              } else if (!order) findNoOrdersArray.push(...findServiceId);
            }
          }
        }
        console.log('findNoServiceIdArray.length:', findNoServiceIdArray.length);
        console.log('findNoOrdersArray.length:', findNoOrdersArray.length);
        console.log('findNoItemsArray.length:', findNoItemsArray.length);
        let uniqueRemainingFileData = [];
        if (findNoItemsArray?.length > 0 || findNoOrdersArray?.length > 0 || findNoServiceIdArray?.length > 0) {
          // Get service IDs that had orders
          const serviceIdsWithOrders = new Set(
            getModifiedRecords
              .filter(rec => rec.order)
              .map(rec => rec.stringValue?.trim())
          );
          // Get service IDs that had line items matched
          const serviceIdsWithLineItems = new Set();

          for (const record of getModifiedRecords) {
            if (!record.order?.orderLine?.length) continue;
            const serviceId = record.stringValue?.trim();
            const orderLines = record.order.orderLine;

            const findServiceId = data.filter(d => d['Service ID'].trim() === serviceId);
            const matched = orderLines.some(line =>
              findServiceId.some(item =>
                line?.item?.internalNumber?.startsWith(item['Product Code'].toString().trim())
              )
            );

            if (matched) {
              serviceIdsWithLineItems.add(serviceId);
            }
          }
          const combinedArray = [...(findNoItemsArray?.length > 0 ? findNoItemsArray : []),
          ...(findNoOrdersArray?.length > 0 ? findNoOrdersArray : []), ...(findNoServiceIdArray?.length > 0 ? findNoServiceIdArray : [])];
          const filtered = combinedArray.filter(item => {
            const sid = item['Service ID'].trim();
            return (!serviceIdsWithOrders.has(sid) && !serviceIdsWithLineItems.has(sid)) ||
              (serviceIdsWithOrders.has(sid) && !serviceIdsWithLineItems.has(sid));
          });
          const seen = new Set();
          uniqueRemainingFileData = filtered.filter(item => {
            const key = JSON.stringify(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const csv = Papa.unparse(uniqueRemainingFileData);
          const folderName =
            __dirname + "/../../../.." + `/remainingPriceUpdateFiles`;
          if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
          }
          const filename = 'ECP01317-Price update(Sheet1)-remainingPriceUpdateFilesData';
          fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
        }
        const upsertGraphPriceUpdateRelateNoDeleteNoInsert = await metaFieldValueService.upsertGraphPriceUpdateRelateNoDeleteNoInsert(getModifiedRecords, trx);
        if (upsertGraphPriceUpdateRelateNoDeleteNoInsert)
          return {
            status: 200,
            data: {
              success: true,
              message: "Success: Price Update",
              data: { before: getRecords, after: upsertGraphPriceUpdateRelateNoDeleteNoInsert, uniqueRemainingFileData },
            }
          };
        return {
          status: 200,
          data: {
            success: false,
            message: "Failure: No records Update",
            data: { before: getRecords, after: getModifiedRecords, uniqueRemainingFileData },
          }
        };
      });
      return returnValue;
    } catch (error) {
      const csv = Papa.unparse([{ error: error?.message }]);
      const folderName =
        __dirname + "/../../../.." + `/priceUpdateErrorFiles`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const filename = `ECP01317-Price update(Sheet1)-ErrorFile`;
      fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
      console.error("Error on Price Update:", error);
      return {
        status: 200,
        data: {
          success: false,
          message: `Catch Error: Error on Price Update. ${error.message}`,
          error
        }
      };
    }
  }
  async priceUpdateSheetThree() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const csvFilePath = path.join(__dirname, '/../../..', 'files', 'ECP01184-Price Update.csv');
        const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
        const json = Papa.parse(csvFileContent, {
          header: true, // if you want to treat the first line as headers
          skipEmptyLines: true,
        });
        const data = json.data;
        const uniqueServiceIds = [
          ...new Set(
            data.map(item => item['Service ID'].trim())
          )
        ];
        console.log('Unique Service IDs length:', uniqueServiceIds.length);
        const getRecords = await metaFieldValueService.getExistedRecords({ serviceIds: uniqueServiceIds }, trx);
        const findNoServiceIdArray = [];
        if (getRecords?.length > 0) {
          const remainingObjects = uniqueServiceIds.filter(
            obj => !getRecords.some(record => record.stringValue.includes(obj))
          );
          const filteredRemainingObjects = data.filter(obj => remainingObjects.includes(obj['Service ID'].trim()));
          if (filteredRemainingObjects && filteredRemainingObjects?.length > 0) findNoServiceIdArray.push(...filteredRemainingObjects);
          console.log('remainingObjects.length:', remainingObjects.length);
          console.log('getRecords.length:', getRecords.length);
          const stringValueCount = {};
          for (const item of getRecords) {
            const val = item.stringValue;
            stringValueCount[val] = (stringValueCount[val] || 0) + 1;
          }

          const duplicates = Object.keys(stringValueCount).filter(
            key => stringValueCount[key] > 1
          );

          console.log('duplicates:', duplicates);
        }
        const getModifiedRecords = getRecords && getRecords.length > 0
          ? JSON.parse(JSON.stringify(getRecords))
          : [];
        const findNoOrdersArray = [];
        const findNoItemsArray = [];
        if (getModifiedRecords?.length > 0) {
          for (const record of getModifiedRecords) {
            const serviceId = record?.stringValue?.trim();
            const findServiceId = data.filter(obj => obj['Service ID'].trim() === serviceId);
            if (findServiceId && findServiceId?.length > 0) {
              const order = record?.order;
              if (order) {
                const orderLine = order?.orderLine;
                if (orderLine && orderLine?.length > 0) {
                  for (const line of orderLine) {
                    const itemInternalNumber = line?.item?.internalNumber || null;
                    const findLineItem = findServiceId.filter(item => itemInternalNumber.startsWith(item['Product Code'].toString().trim()));
                    if (findLineItem && findLineItem?.length > 0) {
                      const price = parseFloat(65);
                      const quantity = parseFloat(line.quantity);
                      const amount = quantity * price;
                      line.price = price.toFixed(10);
                      line.amount = amount.toFixed(10);
                    }
                  }
                }
                const remainingOrderLine = findServiceId.filter(
                  item => !orderLine.some(line => line?.item?.internalNumber.startsWith(item['Product Code'].toString().trim()))
                );
                if (remainingOrderLine && remainingOrderLine?.length > 0) findNoItemsArray.push(...remainingOrderLine);
              } else if (!order) findNoOrdersArray.push(...findServiceId);
            }
          }
        }
        console.log('findNoServiceIdArray.length:', findNoServiceIdArray.length);
        console.log('findNoOrdersArray.length:', findNoOrdersArray.length);
        console.log('findNoItemsArray.length:', findNoItemsArray.length);
        let uniqueRemainingFileData = [];
        if (findNoItemsArray?.length > 0 || findNoOrdersArray?.length > 0 || findNoServiceIdArray?.length > 0) {
          // Get service IDs that had orders
          const serviceIdsWithOrders = new Set(
            getModifiedRecords
              .filter(rec => rec.order)
              .map(rec => rec.stringValue?.trim())
          );
          // Get service IDs that had line items matched
          const serviceIdsWithLineItems = new Set();

          for (const record of getModifiedRecords) {
            if (!record.order?.orderLine?.length) continue;
            const serviceId = record.stringValue?.trim();
            const orderLines = record.order.orderLine;

            const findServiceId = data.filter(d => d['Service ID'].trim() === serviceId);
            const matched = orderLines.some(line =>
              findServiceId.some(item =>
                line?.item?.internalNumber?.startsWith(item['Product Code'].toString().trim())
              )
            );

            if (matched) {
              serviceIdsWithLineItems.add(serviceId);
            }
          }
          const combinedArray = [...(findNoItemsArray?.length > 0 ? findNoItemsArray : []),
          ...(findNoOrdersArray?.length > 0 ? findNoOrdersArray : []), ...(findNoServiceIdArray?.length > 0 ? findNoServiceIdArray : [])];
          const filtered = combinedArray.filter(item => {
            const sid = item['Service ID'].trim();
            return (!serviceIdsWithOrders.has(sid) && !serviceIdsWithLineItems.has(sid)) ||
              (serviceIdsWithOrders.has(sid) && !serviceIdsWithLineItems.has(sid));
          });
          const seen = new Set();
          uniqueRemainingFileData = filtered.filter(item => {
            const key = JSON.stringify(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const csv = Papa.unparse(uniqueRemainingFileData);
          const folderName =
            __dirname + "/../../../.." + `/remainingPriceUpdateFiles`;
          if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
          }
          const filename = 'ECP01184-Price Update-remainingPriceUpdateFilesData';
          fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
        }
        // const upsertGraphPriceUpdateRelateNoDeleteNoInsert = await metaFieldValueService.upsertGraphPriceUpdateRelateNoDeleteNoInsert(getModifiedRecords, trx);
        // if (upsertGraphPriceUpdateRelateNoDeleteNoInsert)
        //   return {
        //     status: 200,
        //     data: {
        //       success: true,
        //       message: "Success: Price Update",
        //       data: { before: getRecords, after: upsertGraphPriceUpdateRelateNoDeleteNoInsert, uniqueRemainingFileData },
        //     }
        //   };
        return {
          status: 200,
          data: {
            success: false,
            message: "Failure: No records Update",
            data: { before: getRecords, after: getModifiedRecords, uniqueRemainingFileData },
          }
        };
      });
      return returnValue;
    } catch (error) {
      const csv = Papa.unparse([{ error: error?.message }]);
      const folderName =
        __dirname + "/../../../.." + `/priceUpdateErrorFiles`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const filename = `ECP01184-Price Update-ErrorFile`;
      fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
      console.error("Error on Price Update:", error);
      return {
        status: 200,
        data: {
          success: false,
          message: `Catch Error: Error on Price Update. ${error.message}`,
          error
        }
      };
    }
  }
  async priceUpdateSheetTwo() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const csvFilePath = path.join(__dirname, '/../../..', 'files', 'Price Increase for EICT - Voice 250801 - Price Rise list for EICT.csv');
        const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
        // Parse the CSV content
        const json = Papa.parse(csvFileContent, {
          header: true, // if you want to treat the first line as headers
          skipEmptyLines: true,
        });

        const data = json.data; // Parse the CSV content
        const uniqueServiceIds = [
          ...new Set(
            data.map(item => item['Service ID'].trim())
          )
        ];
        console.log('Unique Service IDs length:', uniqueServiceIds.length);
        const getRecords = await metaFieldValueService.getExistedRecords({ serviceIds: uniqueServiceIds }, trx);
        const findNoServiceIdArray = [];
        if (getRecords?.length > 0) {
          const remainingObjects = uniqueServiceIds.filter(
            obj => !getRecords.some(record => record.stringValue.includes(obj))
          );
          const filteredRemainingObjects = data.filter(obj => remainingObjects.includes(obj['Service ID'].trim()));
          if (filteredRemainingObjects && filteredRemainingObjects?.length > 0) findNoServiceIdArray.push(...filteredRemainingObjects);
          console.log('remainingObjects.length:', remainingObjects.length);
          console.log('getRecords.length:', getRecords.length);
          const stringValueCount = {};
          for (const item of getRecords) {
            const val = item.stringValue;
            stringValueCount[val] = (stringValueCount[val] || 0) + 1;
          }

          const duplicates = Object.keys(stringValueCount).filter(
            key => stringValueCount[key] > 1
          );

          console.log('duplicates:', duplicates);
        }
        const getModifiedRecords = getRecords && getRecords.length > 0
          ? JSON.parse(JSON.stringify(getRecords))
          : [];
        const findNoOrdersArray = [];
        const findNoItemsArray = [];
        if (getModifiedRecords?.length > 0) {
          for (const record of getModifiedRecords) {
            const serviceId = record?.stringValue?.trim();
            const findServiceId = data.filter(obj => obj['Service ID'].trim() === serviceId);
            if (findServiceId && findServiceId?.length > 0) {
              const order = record?.order;
              if (order) {
                const orderLine = order?.orderLine;
                if (orderLine && orderLine?.length > 0) {
                  for (const line of orderLine) {
                    const itemInternalNumber = line?.item?.internalNumber || null;
                    const findLineItem = findServiceId.filter(item => itemInternalNumber.startsWith(item['Product Code'].toString().trim()));
                    if (findLineItem && findLineItem?.length > 0) {
                      const price = parseFloat(findLineItem[0]['New Unit Price']);
                      const quantity = parseFloat(findLineItem[0]['Sum of Quantity (Units)']);
                      if (quantity.toFixed(10) !== line.quantity) {
                        console.warn(`Quantity mismatch for Service ID ${serviceId} and Item Internal Number ${itemInternalNumber}: CSV quantity ${quantity.toFixed(10)}, Order quantity ${line.quantity}`);
                      }
                      const amount = quantity * price;
                      const csvAmount = parseFloat(findLineItem[0]['NEW Total Price (ex)']);
                      if (amount.toFixed(6) !== csvAmount.toFixed(6)) {
                        console.warn(`Amount mismatch for Service ID ${serviceId} and Item Internal Number ${itemInternalNumber}: CSV amount ${csvAmount.toFixed(6)}, Calculated amount ${amount.toFixed(6)}`);
                      }
                      // line.price = price.toFixed(10);
                      // line.amount = amount.toFixed(10);
                    }
                  }
                }
                const remainingOrderLine = findServiceId.filter(
                  item => !orderLine.some(line => line?.item?.internalNumber.startsWith(item['Product Code'].toString().trim()))
                );
                if (remainingOrderLine && remainingOrderLine?.length > 0) findNoItemsArray.push(...remainingOrderLine);
              } else if (!order) findNoOrdersArray.push(...findServiceId);
            }
          }
        }
        console.log('findNoServiceIdArray.length:', findNoServiceIdArray.length);
        console.log('findNoOrdersArray.length:', findNoOrdersArray.length);
        console.log('findNoItemsArray.length:', findNoItemsArray.length);
        let uniqueRemainingFileData = [];
        if (findNoItemsArray?.length > 0 || findNoOrdersArray?.length > 0 || findNoServiceIdArray?.length > 0) {
          // Get service IDs that had orders
          const serviceIdsWithOrders = new Set(
            getModifiedRecords
              .filter(rec => rec.order)
              .map(rec => rec.stringValue?.trim())
          );
          // Get service IDs that had line items matched
          const serviceIdsWithLineItems = new Set();

          for (const record of getModifiedRecords) {
            if (!record.order?.orderLine?.length) continue;
            const serviceId = record.stringValue?.trim();
            const orderLines = record.order.orderLine;

            const findServiceId = data.filter(d => d['Service ID'].trim() === serviceId);
            const matched = orderLines.some(line =>
              findServiceId.some(item =>
                line?.item?.internalNumber?.startsWith(item['Product Code'].toString().trim())
              )
            );

            if (matched) {
              serviceIdsWithLineItems.add(serviceId);
            }
          }
          const combinedArray = [...(findNoItemsArray?.length > 0 ? findNoItemsArray : []),
          ...(findNoOrdersArray?.length > 0 ? findNoOrdersArray : []), ...(findNoServiceIdArray?.length > 0 ? findNoServiceIdArray : [])];
          const filtered = combinedArray.filter(item => {
            const sid = item['Service ID'].trim();
            return (!serviceIdsWithOrders.has(sid) && !serviceIdsWithLineItems.has(sid)) ||
              (serviceIdsWithOrders.has(sid) && !serviceIdsWithLineItems.has(sid));
          });
          const seen = new Set();
          uniqueRemainingFileData = filtered.filter(item => {
            const key = JSON.stringify(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const csv = Papa.unparse(uniqueRemainingFileData);
          const folderName =
            __dirname + "/../../../.." + `/remainingPriceUpdateFiles`;
          if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName, { recursive: true });
          }
          const filename = 'Price Increase for EICT-remainingPriceUpdateFilesData';
          fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
        }
        return {
          status: 200,
          data: {
            success: true,
            message: "Success: Price Update",
            data: { before: getRecords, after: getModifiedRecords, uniqueRemainingFileData },
          }
        };
      });
      return returnValue;
    } catch (error) {
      const csv = Papa.unparse([{ error: error?.message }]);
      const folderName =
        __dirname + "/../../../.." + `/priceUpdateErrorFiles`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const filename = `Price Increase for EICT-ErrorFile`;
      fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
      console.error("Error on Price Update:", error);
      return {
        status: 200,
        data: {
          success: false,
          message: `Catch Error: Error on Price Update. ${error.message}`,
          error
        }
      };
    }
  }
}

module.exports = new controller();