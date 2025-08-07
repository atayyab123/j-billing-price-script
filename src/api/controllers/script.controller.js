const { Model } = require("objection");
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const metaFieldValueService = require("../services/metaFieldValue.service");
const itemTypeService = require("../services/itemType.service");
const itemService = require("../services/item.service");
const jbillingTableService = require("../services/jbillingTable.service");
const metaFieldNameService = require("../services/metaFieldName.service");
const itemTypeEntityMapService = require("../services/itemTypeEntityMap.service");
const metaFieldGroupService = require("../services/metaFieldGroup.service");
const customerService = require("../services/customer.service");
const baseUserService = require("../services/baseUser.service");
const itemTypeMapService = require("../services/itemTypeMap.service");
const internationalDescriptionService = require("../services/internationalDescription.service");
const itemMetaFieldMapService = require("../services/itemMetaFieldMap.service");
const itemEntityMapService = require("../services/itemEntityMap.service");
const purchaseOrderService = require("../services/purchaseOrder.service");
const orderLineService = require("../services/orderLine.service");

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
                    const orderChange = line?.orderChange;
                    if (orderChange && orderChange?.length > 1) console.log('orderChange.length', orderChange.length, orderChange.orderLineId);
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
  async priceUpdateSheetFour() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const csvFilePath = path.join(__dirname, '/../../..', 'files', 'Price update-August 2025.csv');
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
                    // const orderChange = line?.orderChange;
                    // if (orderChange && orderChange?.length > 1) console.log('orderChange.length', orderChange.length, orderChange.orderLineId);
                    const itemInternalNumber = line?.item?.internalNumber || null;
                    const findLineItem = findServiceId.filter(item => itemInternalNumber.startsWith(item['Product Code'].toString().trim()));
                    if (findLineItem && findLineItem?.length > 0) {
                      const price = parseFloat(findLineItem[0]['NEW Unit Price (ex)']);
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
          const filename = 'Price update-August 2025-remainingPriceUpdateFilesData';
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
      const filename = `Price update-August 2025-ErrorFile`;
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

  async products() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const csvFilePath = path.join(__dirname, '/../../..', 'files', 'Products_Updated_20250805.csv');
        const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
        // Parse the CSV content
        const json = Papa.parse(csvFileContent, {
          header: true, // if you want to treat the first line as headers
          skipEmptyLines: true,
        });

        const data = json.data; // Parse the CSV content
        console.log('Products data length:', data.length);
        const toRemove = ['3120100_BusinessLine', '2100000_SIP Phone'];
        const filteredData = data.filter(item => !toRemove.includes(item["Group Code"].trim()));
        console.log('Products filteredData length:', filteredData.length);
        // const filteredRemoveData = data.filter(item => toRemove.includes(item["Group Code"].trim()));
        // console.log('Products filteredRemoveData length:', filteredRemoveData.length);
        // const getProductRelation = await itemTypeEntityMapService.getProductRelation(toRemove, trx);

        const getMaxItemTypeId = await itemTypeService.maxId(trx);
        let maxItemTypeId = parseInt(getMaxItemTypeId);
        const getMaxItemId = await itemService.maxId(trx);
        let maxItemId = parseInt(getMaxItemId);
        const getMaxMetaFieldValueId = await metaFieldValueService.maxId(trx);
        let maxMetaFieldValueId = parseInt(getMaxMetaFieldValueId);
        const getItemTableId = await jbillingTableService.itemTableId(trx);
        const itemTableId = parseInt(getItemTableId.id);
        const getGroupCode = await metaFieldNameService.getGroupCode(trx);
        const metaFieldNameIdGroupCode = parseInt(getGroupCode.id);
        const getTerm = await metaFieldNameService.getTerm(trx);
        const metaFieldNameIdTerm = parseInt(getTerm.id);
        const getTaxScheme = await metaFieldNameService.getTaxScheme(trx);
        const metaFieldNameIdTaxScheme = parseInt(getTaxScheme.id);
        const getRecurringCharge = await metaFieldNameService.getRecurringCharge(trx);
        const metaFieldNameIdRecurringCharge = parseInt(getRecurringCharge.id);
        const getEstablishmentCharge = await metaFieldNameService.getEstablishmentCharge(trx);
        const metaFieldNameIdEstablishmentCharge = parseInt(getEstablishmentCharge.id);

        // // Convert filteredRemoveData into a map by groupCode
        // const groupedData = {};
        // filteredRemoveData.forEach(entry => {
        //   if (!groupedData[entry["Group Code"].trim()]) {
        //     groupedData[entry["Group Code"].trim()] = [];
        //   }
        //   groupedData[entry["Group Code"].trim()].push(entry);
        // });

        // // Convert filteredRemoveData into a lookup map
        // const productDataMap = {};
        // filteredRemoveData.forEach(entry => {
        //   productDataMap[entry["Product Code"].trim()] = entry;
        // });

        // const hasField = (metaFieldValueArray, metaFieldNameId) =>
        //   metaFieldValueArray.some(mv => mv.metaFieldNameId === metaFieldNameId);

        // // Final output
        // const finalOutput = getProductRelation.map(relation => {
        //   const { description } = relation.itemType;
        //   const relatedProducts = groupedData[description] || [];
        //   const existingInternalNumbers = relation.itemType.item.map(it => it.internalNumber);
        //   const items = relation.itemType.item;

        //   // Add missing metaFieldValues to existing items
        //   items.forEach(item => {
        //     const product = productDataMap[item.internalNumber];
        //     if (!product) return;

        //     if (!item.metaFieldValue) item.metaFieldValue = [];

        //     if (!hasField(item.metaFieldValue, metaFieldNameIdGroupCode)) {
        //       item.metaFieldValue.push(this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdGroupCode, "string", product["Group Code"].trim()));
        //     }
        //     if (!hasField(item.metaFieldValue, metaFieldNameIdTerm)) {
        //       item.metaFieldValue.push(this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdTerm, "decimal", product["Term"].trim()));
        //     }
        //     if (!hasField(item.metaFieldValue, metaFieldNameIdTaxScheme)) {
        //       item.metaFieldValue.push(this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdTaxScheme, "string", "TAX_GST"));
        //     }
        //     if (!hasField(item.metaFieldValue, metaFieldNameIdRecurringCharge)) {
        //       item.metaFieldValue.push(this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdRecurringCharge, "decimal", product["Recurring Charge"].trim()));
        //     }
        //     if (!hasField(item.metaFieldValue, metaFieldNameIdEstablishmentCharge)) {
        //       item.metaFieldValue.push(this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdEstablishmentCharge, "decimal", product["Establishment Charge"].trim()));
        //     }
        //   });

        //   relatedProducts.forEach(product => {
        //     if (!existingInternalNumbers.includes(product["Product Code"].trim())) {
        //       relation.itemType.item.push({
        //         id: ++maxItemId,
        //         internalNumber: product["Product Code"].trim(),
        //         entityId: 20,
        //         optlock: 1,
        //         priceManual: 0,
        //         itemEntityMap: {
        //           entityId: 20
        //         },
        //         internationalDescription: {
        //           tableId: itemTableId,
        //           psudoColumn: "description",
        //           languageId: 1,
        //           content: product["Service Name"].trim()
        //         },
        //         metaFieldValue: [
        //           this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdGroupCode, "string", product["Group Code"].trim()),
        //           this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdTerm, "decimal", product["Term"].trim()),
        //           this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdTaxScheme, "string", "TAX_GST"),
        //           this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdRecurringCharge, "decimal", product["Recurring Charge"].trim()),
        //           this.createMetaFieldValue(++maxMetaFieldValueId, metaFieldNameIdEstablishmentCharge, "decimal", product["Establishment Charge"].trim())
        //         ]
        //       });
        //     }
        //   });

        //   return relation;
        // });

        const grouped = {};

        filteredData.forEach(entry => {
          const group = entry["Group Code"].trim();
          if (!grouped[group]) {
            grouped[group] = [];
          }
          grouped[group].push(entry);
        });

        const output = []

        Object.entries(grouped).forEach(([groupCode, items]) => {
          const itemType = {
            id: ++maxItemTypeId,
            entityId: 20,
            description: groupCode,
            orderLineTypeId: 1,
            optlock: 1,
            internal: "f",
            item: []
          };

          items.forEach(entry => {
            const item = {
              id: ++maxItemId,
              internalNumber: entry["Product Code"].trim(),
              entityId: 20,
              optlock: 1,
              priceManual: 0,
              itemEntityMap: {
                entityId: 20
              },
              internationalDescription: {
                tableId: itemTableId,
                psudoColumn: "description",
                languageId: 1,
                content: entry["Service Name"].trim()
              },
              metaFieldValue: [
                {
                  id: ++maxMetaFieldValueId,
                  metaFieldNameId: metaFieldNameIdGroupCode,
                  dtype: "string",
                  stringValue: entry["Group Code"]
                },
                {
                  id: ++maxMetaFieldValueId,
                  metaFieldNameId: metaFieldNameIdTerm,
                  dtype: "decimal",
                  decimalValue: parseInt(entry["Term"].trim())
                },
                {
                  id: ++maxMetaFieldValueId,
                  metaFieldNameId: metaFieldNameIdTaxScheme,
                  dtype: "string",
                  stringValue: "TAX_GST" // assuming constant
                },
                {
                  id: ++maxMetaFieldValueId,
                  metaFieldNameId: metaFieldNameIdRecurringCharge,
                  dtype: "decimal",
                  decimalValue: parseFloat(entry["Recurring Charge"].trim())
                },
                {
                  id: ++maxMetaFieldValueId,
                  metaFieldNameId: metaFieldNameIdEstablishmentCharge,
                  dtype: "decimal",
                  decimalValue: parseFloat(entry["Establishment Charge"].trim())
                }
              ]
            };
            itemType.item.push(item);
          });

          output.push({
            entityId: 20,
            itemType
          });
        });

        console.log('Output length:', output.length);

        const upsertGraphInsertMissingNoDeleteNoUpdateNoRelate = await itemTypeEntityMapService.upsertGraphInsertMissingNoDeleteNoUpdateNoRelate(output, trx);

        if (upsertGraphInsertMissingNoDeleteNoUpdateNoRelate) {
          return {
            status: 200,
            data: {
              success: true,
              message: "Success: Products Inserted",
              data: upsertGraphInsertMissingNoDeleteNoUpdateNoRelate,
            }
          };
        }

        // const upsertGraphInsertMissingNoDeleteRelate = await itemTypeEntityMapService.upsertGraphInsertMissingNoDeleteRelate(finalOutput, trx);
        // if (upsertGraphInsertMissingNoDeleteRelate) {
        //   return {
        //     status: 200,
        //     data: {
        //       success: true,
        //       message: "Success: Products Upsert",
        //       data: upsertGraphInsertMissingNoDeleteRelate,
        //     }
        //   };
        // }
        return {
          status: 200,
          data: {
            success: false,
            message: "Failure: No records Inserted",
            data: { filteredData, output },
          }
        };
      });
      return returnValue;
    } catch (error) {
      const csv = Papa.unparse([{ error: error?.message }]);
      const folderName =
        __dirname + "/../../../.." + `/productsErrorFiles`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const filename = `Products-ErrorFile`;
      fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
      console.error("Error on Price Update:", error);
      return {
        status: 200,
        data: {
          success: false,
          message: `Catch Error: Error on Products UpsertGraph. ${error.message}`,
          error
        }
      };
    }
  }

  createMetaFieldValue(metaFieldValueId, metaFieldNameId, dtype, value) {
    const meta = {
      id: metaFieldValueId,
      metaFieldNameId,
      dtype
    };
    if (dtype === "decimal") {
      meta.decimalValue = parseFloat(value);
    } else if (dtype === "string") {
      meta.stringValue = value;
    }
    return meta;
  };

  async userHierarchy() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const channelPartners = await this.parseCsvFile('Channel Partners.csv');
        console.log('Channel Partners data length:', channelPartners.length);

        const customers = await this.parseCsvFile('Customers.csv');
        console.log('Customers data length:', customers.length);

        const sites = await this.parseCsvFile('Sites.csv');
        console.log('Sites data length:', sites.length);

        const getChannelPartnerGroup = await metaFieldGroupService.getChannelPartnerGroup(trx);
        const metaFieldGroupAccountTypeIdChannelPartner = parseInt(getChannelPartnerGroup.accountTypeId);
        const getCustomerGroup = await metaFieldGroupService.getCustomerGroup(trx);
        const metaFieldGroupAccountTypeIdCustomer = parseInt(getCustomerGroup.accountTypeId);
        const getSiteGroup = await metaFieldGroupService.getSiteGroup(trx);
        const metaFieldGroupAccountTypeIdSite = parseInt(getSiteGroup.accountTypeId);

        const getCustomerTypeName = await metaFieldNameService.getCustomerTypeName(trx);
        const metaFieldCustomerTypeNameId = parseInt(getCustomerTypeName.id);
        const getCustomerTypeGST = await metaFieldNameService.getCustomerTypeGST(trx);
        const metaFieldCustomerTypeGSTId = parseInt(getCustomerTypeGST.id);

        const getAccountTypeCpId = await metaFieldNameService.getAccountTypeCpId(trx);
        const metaFieldAccountTypeCpIDId = parseInt(getAccountTypeCpId.id);
        const getAccountTypeChannelPartnerNameId = await metaFieldNameService.getAccountTypeChannelPartnerNameId(trx);
        const metaFieldAccountTypeChannelPartnerNameId = parseInt(getAccountTypeChannelPartnerNameId.id);
        const getAccountTypeCpEmailId = await metaFieldNameService.getAccountTypeCpEmailId(trx);
        const metaFieldAccountTypeEmailId = parseInt(getAccountTypeCpEmailId.id);
        const getAccountTypeCpOfficePhoneId = await metaFieldNameService.getAccountTypeCpOfficePhoneId(trx);
        const metaFieldAccountTypeOfficePhoneId = parseInt(getAccountTypeCpOfficePhoneId.id);
        const getAccountTypeCpOfficeFaxId = await metaFieldNameService.getAccountTypeCpOfficeFaxId(trx);
        const metaFieldAccountTypeOfficeFaxId = parseInt(getAccountTypeCpOfficeFaxId.id);
        const getAccountTypeCpAbnAcnId = await metaFieldNameService.getAccountTypeCpAbnAcnId(trx);
        const metaFieldAccountTypeAbnAcnId = parseInt(getAccountTypeCpAbnAcnId.id);
        const getAccountTypeCpOfficeStreetId = await metaFieldNameService.getAccountTypeCpOfficeStreetId(trx);
        const metaFieldAccountTypeOfficeStreetId = parseInt(getAccountTypeCpOfficeStreetId.id);
        const getAccountTypeCpOfficeCityId = await metaFieldNameService.getAccountTypeCpOfficeCityId(trx);
        const metaFieldAccountTypeOfficeCityId = parseInt(getAccountTypeCpOfficeCityId.id);
        const getAccountTypeCpOfficeStateId = await metaFieldNameService.getAccountTypeCpOfficeStateId(trx);
        const metaFieldAccountTypeOfficeStateId = parseInt(getAccountTypeCpOfficeStateId.id);
        const getAccountTypeCpOfficePostcodeId = await metaFieldNameService.getAccountTypeCpOfficePostcodeId(trx);
        const metaFieldAccountTypeOfficePostcodeId = parseInt(getAccountTypeCpOfficePostcodeId.id);
        const getAccountTypeCpOfficeCountryId = await metaFieldNameService.getAccountTypeCpOfficeCountryId(trx);
        const metaFieldAccountTypeOfficeCountryId = parseInt(getAccountTypeCpOfficeCountryId.id);
        const getAccountTypeCpPostalStreetId = await metaFieldNameService.getAccountTypeCpPostalStreetId(trx);
        const metaFieldAccountTypePostalStreetId = parseInt(getAccountTypeCpPostalStreetId.id);
        const getAccountTypeCpPostalCityId = await metaFieldNameService.getAccountTypeCpPostalCityId(trx);
        const metaFieldAccountTypePostalCityId = parseInt(getAccountTypeCpPostalCityId.id);
        const getAccountTypeCpPostalStateId = await metaFieldNameService.getAccountTypeCpPostalStateId(trx);
        const metaFieldAccountTypePostalStateId = parseInt(getAccountTypeCpPostalStateId.id);
        const getAccountTypeCpPostalPostcodeId = await metaFieldNameService.getAccountTypeCpPostalPostcodeId(trx);
        const metaFieldAccountTypePostalPostcodeId = parseInt(getAccountTypeCpPostalPostcodeId.id);
        const getAccountTypeCpPostalCountryId = await metaFieldNameService.getAccountTypeCpPostalCountryId(trx);
        const metaFieldAccountTypePostalCountryId = parseInt(getAccountTypeCpPostalCountryId.id);

        const getAccountTypeCustomerIDId = await metaFieldNameService.getAccountTypeCustomerIDId(trx);
        const metaFieldAccountTypeCustomerIDId = parseInt(getAccountTypeCustomerIDId.id);
        const getAccountTypeCustomerNameId = await metaFieldNameService.getAccountTypeCustomerNameId(trx);
        const metaFieldAccountTypeCustomerNameId = parseInt(getAccountTypeCustomerNameId.id);
        const getAccountTypeCustomerLevelId = await metaFieldNameService.getAccountTypeCustomerLevelId(trx);
        const metaFieldAccountTypeCustomerLevelId = parseInt(getAccountTypeCustomerLevelId.id);
        const getAccountTypeCustomerSubAddressTypeId = await metaFieldNameService.getAccountTypeCustomerSubAddressTypeId(trx);
        const metaFieldAccountTypeCustomerSubAddressTypeId = parseInt(getAccountTypeCustomerSubAddressTypeId.id);
        const getAccountTypeCustomerSubAddressNumberId = await metaFieldNameService.getAccountTypeCustomerSubAddressNumberId(trx);
        const metaFieldAccountTypeCustomerSubAddressNumberId = parseInt(getAccountTypeCustomerSubAddressNumberId.id);
        const getAccountTypeCustomerStreetNumberId = await metaFieldNameService.getAccountTypeCustomerStreetNumberId(trx);
        const metaFieldAccountTypeStreetNumberId = parseInt(getAccountTypeCustomerStreetNumberId.id);
        const getAccountTypeCustomerStreetNumberSuffixId = await metaFieldNameService.getAccountTypeCustomerStreetNumberSuffixId(trx);
        const metaFieldAccountTypeStreetNumberSuffixId = parseInt(getAccountTypeCustomerStreetNumberSuffixId.id);
        const getAccountTypeCustomerStreetNameId = await metaFieldNameService.getAccountTypeCustomerStreetNameId(trx);
        const metaFieldAccountTypeStreetNameId = parseInt(getAccountTypeCustomerStreetNameId.id);
        const getAccountTypeCustomerStreetTypeId = await metaFieldNameService.getAccountTypeCustomerStreetTypeId(trx);
        const metaFieldAccountTypeStreetTypeId = parseInt(getAccountTypeCustomerStreetTypeId.id);
        const getAccountTypeCustomerStreetTypeSuffixId = await metaFieldNameService.getAccountTypeCustomerStreetTypeSuffixId(trx);
        const metaFieldAccountTypeStreetTypeSuffixId = parseInt(getAccountTypeCustomerStreetTypeSuffixId.id);
        const getAccountTypeCustomerSuburbId = await metaFieldNameService.getAccountTypeCustomerSuburbId(trx);
        const metaFieldAccountTypeSuburbId = parseInt(getAccountTypeCustomerSuburbId.id);
        const getAccountTypeCustomerStateId = await metaFieldNameService.getAccountTypeCustomerStateId(trx);
        const metaFieldAccountTypeStateId = parseInt(getAccountTypeCustomerStateId.id);
        const getAccountTypeCustomerPostcodeId = await metaFieldNameService.getAccountTypeCustomerPostcodeId(trx);
        const metaFieldAccountTypePostcodeId = parseInt(getAccountTypeCustomerPostcodeId.id);
        const getAccountTypeCustomerOfficePhoneId = await metaFieldNameService.getAccountTypeCustomerOfficePhoneId(trx);
        const metaFieldAccountTypeCustomerOfficePhoneId = parseInt(getAccountTypeCustomerOfficePhoneId.id);
        const getAccountTypeCustomerEmailId = await metaFieldNameService.getAccountTypeCustomerEmailId(trx);
        const metaFieldAccountTypeCustomerEmailId = parseInt(getAccountTypeCustomerEmailId.id);
        const getAccountTypeCustomerAndSiteCpIDId = await metaFieldNameService.getAccountTypeCustomerAndSiteCpIDId(trx);
        const metaFieldAccountTypeCustomerAndSiteCpIDId = parseInt(getAccountTypeCustomerAndSiteCpIDId.id);

        const getAccountTypeSiteIDId = await metaFieldNameService.getAccountTypeSiteIDId(trx);
        const metaFieldAccountTypeSiteIDId = parseInt(getAccountTypeSiteIDId.id);
        const getAccountTypeSiteNameId = await metaFieldNameService.getAccountTypeSiteNameId(trx);
        const metaFieldAccountTypeSiteNameId = parseInt(getAccountTypeSiteNameId.id);
        const getAccountTypeSiteLevelId = await metaFieldNameService.getAccountTypeSiteLevelId(trx);
        const metaFieldAccountTypeSiteLevelId = parseInt(getAccountTypeSiteLevelId.id);
        const getAccountTypeSiteSubAddressTypeId = await metaFieldNameService.getAccountTypeSiteSubAddressTypeId(trx);
        const metaFieldAccountTypeSiteSubAddressTypeId = parseInt(getAccountTypeSiteSubAddressTypeId.id);
        const getAccountTypeSiteSubAddressNumberId = await metaFieldNameService.getAccountTypeSiteSubAddressNumberId(trx);
        const metaFieldAccountTypeSiteSubAddressNumberId = parseInt(getAccountTypeSiteSubAddressNumberId.id);
        const getAccountTypeSiteStreetNumberId = await metaFieldNameService.getAccountTypeSiteStreetNumberId(trx);
        const metaFieldAccountTypeSiteStreetNumberId = parseInt(getAccountTypeSiteStreetNumberId.id);
        const getAccountTypeSiteStreetNumberSuffixId = await metaFieldNameService.getAccountTypeSiteStreetNumberSuffixId(trx);
        const metaFieldAccountTypeSiteStreetNumberSuffixId = parseInt(getAccountTypeSiteStreetNumberSuffixId.id);
        const getAccountTypeSiteStreetNameId = await metaFieldNameService.getAccountTypeSiteStreetNameId(trx);
        const metaFieldAccountTypeSiteStreetNameId = parseInt(getAccountTypeSiteStreetNameId.id);
        const getAccountTypeSiteStreetTypeId = await metaFieldNameService.getAccountTypeSiteStreetTypeId(trx);
        const metaFieldAccountTypeSiteStreetTypeId = parseInt(getAccountTypeSiteStreetTypeId.id);
        const getAccountTypeSiteStreetTypeSuffixId = await metaFieldNameService.getAccountTypeSiteStreetTypeSuffixId(trx);
        const metaFieldAccountTypeSiteStreetTypeSuffixId = parseInt(getAccountTypeSiteStreetTypeSuffixId.id);
        const getAccountTypeSiteSuburbId = await metaFieldNameService.getAccountTypeSiteSuburbId(trx);
        const metaFieldAccountTypeSiteSuburbId = parseInt(getAccountTypeSiteSuburbId.id);
        const getAccountTypeSiteStateId = await metaFieldNameService.getAccountTypeSiteStateId(trx);
        const metaFieldAccountTypeSiteStateId = parseInt(getAccountTypeSiteStateId.id);
        const getAccountTypeSitePostcodeId = await metaFieldNameService.getAccountTypeSitePostcodeId(trx);
        const metaFieldAccountTypeSitePostcodeId = parseInt(getAccountTypeSitePostcodeId.id);
        const getAccountTypeSiteCountryId = await metaFieldNameService.getAccountTypeSiteCountryId(trx);
        const metaFieldAccountTypeSiteCountryId = parseInt(getAccountTypeSiteCountryId.id);
        const getAccountTypeSiteMainPhoneId = await metaFieldNameService.getAccountTypeSiteMainPhoneId(trx);
        const metaFieldAccountTypeSiteMainPhoneId = parseInt(getAccountTypeSiteMainPhoneId.id);
        const getAccountTypeSiteCustomerIDId = await metaFieldNameService.getAccountTypeSiteCustomerIDId(trx);
        const metaFieldAccountTypeSiteCustomerIDId = parseInt(getAccountTypeSiteCustomerIDId.id);

        const getMaxMetaFieldValueId = await metaFieldValueService.maxId(trx);
        let maxMetaFieldValueId = parseInt(getMaxMetaFieldValueId);
        const getMaxCustomerId = await customerService.maxId(trx);
        let maxCustomerId = parseInt(getMaxCustomerId);
        const getMaxUserId = await baseUserService.maxId(trx);
        let maxUserId = parseInt(getMaxUserId);

        const output = channelPartners.map((cp) => {
          const cpMeta = [
            this.createMeta(++maxMetaFieldValueId, metaFieldCustomerTypeNameId, cp['Channel Partner'].trim()),
            this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCpIDId, cp['CP ID'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeChannelPartnerNameId, cp['Channel Partner'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Email'].trim() !== 'NULL'
              && cp['Email'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeEmailId, cp['Email'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Office Phone'].trim() !== 'NULL'
              && cp['Office Phone'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeOfficePhoneId, cp['Office Phone'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Office Fax'].trim() !== 'NULL' && cp['Office Fax'].trim() !== '0'
              && cp['Office Fax'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeOfficeFaxId, cp['Office Fax'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['ACN/ABN'].trim() !== 'NULL'
              && cp['ACN/ABN'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeAbnAcnId, cp['ACN/ABN'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            cp['Office Street'].trim() !== 'NULL' && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeOfficeStreetId, cp['Office Street'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            cp['Office City'].trim() !== 'NULL' && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeOfficeCityId, cp['Office City'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            cp['Office State'].trim() !== 'NULL' && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeOfficeStateId, cp['Office State'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            cp['Office Postcode'].trim() !== 'NULL' && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeOfficePostcodeId, cp['Office Postcode'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Office Country'].trim() !== 'NULL'
              && cp['Office Country'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeOfficeCountryId, cp['Office Country'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Postal Street'].trim() !== 'NULL'
              && cp['Postal Street'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypePostalStreetId, cp['Postal Street'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Postal City'].trim() !== 'NULL'
              && cp['Postal City'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypePostalCityId, cp['Postal City'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Postal State'].trim() !== 'NULL'
              && cp['Postal State'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypePostalStateId, cp['Postal State'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Postal Postcode'].trim() !== 'NULL'
              && cp['Postal Postcode'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypePostalPostcodeId, cp['Postal Postcode'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
            (cp['Postal Country'].trim() !== 'NULL'
              && cp['Postal Country'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypePostalCountryId, cp['Postal Country'].trim(), metaFieldGroupAccountTypeIdChannelPartner),
          ].filter(Boolean);

          const cpCustomers = customers.filter(c => c['CP ID'].trim() === cp['CP ID'].trim());
          const customerChildren = cpCustomers.map((cust) => {
            const custMeta = [
              this.createMeta(++maxMetaFieldValueId, metaFieldCustomerTypeNameId, cust['Customer Name'].trim()),
              this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerIDId, cust['Customer ID'].trim(), metaFieldGroupAccountTypeIdCustomer),
              this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerNameId, cust['Customer Name'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Level'].trim() !== 'NULL'
                && cust['Level'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerLevelId, cust['Level'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Sub Address Type'].trim() !== 'NULL'
                && cust['Sub Address Type'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerSubAddressTypeId, cust['Sub Address Type'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Sub Address Number'].trim() !== 'NULL'
                && cust['Sub Address Number'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerSubAddressNumberId, cust['Sub Address Number'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Street Number'].trim() !== 'NULL'
                && cust['Street Number'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeStreetNumberId, cust['Street Number'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Street Number Suffix'].trim() !== 'NULL'
                && cust['Street Number Suffix'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeStreetNumberSuffixId, cust['Street Number Suffix'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Street Name'].trim() !== 'NULL'
                && cust['Street Name'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeStreetNameId, cust['Street Name'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Street Type'].trim() !== 'NULL'
                && cust['Street Type'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeStreetTypeId, cust['Street Type'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Street Type Suffix'].trim() !== 'NULL'
                && cust['Street Type Suffix'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeStreetTypeSuffixId, cust['Street Type Suffix'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Suburb'].trim() !== 'NULL'
                && cust['Suburb'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSuburbId, cust['Suburb'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['State'].trim() !== 'NULL'
                && cust['State'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeStateId, cust['State'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Postcode'].trim() !== 'NULL'
                && cust['Postcode'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypePostcodeId, cust['Postcode'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Office Phone'].trim() !== 'NULL' && cust['Office Phone'].trim() !== '0'
                && cust['Office Phone'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerOfficePhoneId, cust['Office Phone'].trim(), metaFieldGroupAccountTypeIdCustomer),
              (cust['Email'].trim() !== 'NULL'
                && cust['Email'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerEmailId, cust['Email'].trim(), metaFieldGroupAccountTypeIdCustomer),
              this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerAndSiteCpIDId, cust['CP ID'].trim(), metaFieldGroupAccountTypeIdCustomer),
            ].filter(Boolean);

            const custSites = sites.filter(s => s['CP ID'].trim() === cp['CP ID'].trim() && s['Customer ID'].trim() === cust['Customer ID'].trim());
            const siteChildren = custSites.map(site => {
              const siteMeta = [
                this.createMeta(++maxMetaFieldValueId, metaFieldCustomerTypeNameId, site['Site Name'].trim()),
                (site['Tax Type'].trim() !== 'NULL'
                  && site['Tax Type'].trim() !== '0') && this.createMeta(++maxMetaFieldValueId, metaFieldCustomerTypeGSTId, null, null, true), // always 't'
                this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteIDId, site['Site ID'].trim(), metaFieldGroupAccountTypeIdSite),
                this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteNameId, site['Site Name'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Level'].trim() !== 'NULL'
                  && site['Level'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteLevelId, site['Level'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Sub Address Type'].trim() !== 'NULL'
                  && site['Sub Address Type'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteSubAddressTypeId, site['Sub Address Type'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Sub Address Number'].trim() !== 'NULL'
                  && site['Sub Address Number'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteSubAddressNumberId, site['Sub Address Number'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Street Number'].trim() !== 'NULL'
                  && site['Street Number'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteStreetNumberId, site['Street Number'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Street Number Suffix'].trim() !== 'NULL'
                  && site['Street Number Suffix'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteStreetNumberSuffixId, site['Street Number Suffix'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Street Name'].trim() !== 'NULL'
                  && site['Street Name'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteStreetNameId, site['Street Name'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Street Type'].trim() !== 'NULL'
                  && site['Street Type'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteStreetTypeId, site['Street Type'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Street Type Suffix'].trim() !== 'NULL'
                  && site['Street Type Suffix'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteStreetTypeSuffixId, site['Street Type Suffix'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Suburb'].trim() !== 'NULL'
                  && site['Suburb'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteSuburbId, site['Suburb'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['State'].trim() !== 'NULL'
                  && site['State'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteStateId, site['State'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Postcode'].trim() !== 'NULL'
                  && site['Postcode'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSitePostcodeId, site['Postcode'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Country'].trim() !== 'NULL'
                  && site['Country'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteCountryId, site['Country'].trim(), metaFieldGroupAccountTypeIdSite),
                (site['Site Main Phone'].trim() !== 'NULL'
                  && site['Site Main Phone'].trim() !== '') && this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteMainPhoneId, site['Site Main Phone'].trim(), metaFieldGroupAccountTypeIdSite),
                this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeSiteCustomerIDId, site['Customer ID'].trim(), metaFieldGroupAccountTypeIdSite),
                this.createMeta(++maxMetaFieldValueId, metaFieldAccountTypeCustomerAndSiteCpIDId, site['CP ID'].trim(), metaFieldGroupAccountTypeIdSite),
              ].filter(Boolean);
              return this.createAccount({
                customerId: ++maxCustomerId,
                userName: site['Site ID'],
                accountTypeId: metaFieldGroupAccountTypeIdSite,
                metaFields: siteMeta,
                nextInvoiceDayOfPeriod: cp['Billing Date'].trim() !== 'NULL' && cp['Billing Date'].trim() !== '' ? parseInt(cp['Billing Date'].trim()) : 1,
                nextInoviceDate: cp['Billing Date'].trim() !== 'NULL' && cp['Billing Date'].trim() !== '' ? `2025-08-${cp['Billing Date'].trim() === '1' ? '01' : cp['Billing Date'].trim()}` : '2025-08-01',
                userId: ++maxUserId
              });
            });

            return this.createAccount({
              customerId: ++maxCustomerId,
              userName: cust['Customer ID'],
              accountTypeId: metaFieldGroupAccountTypeIdCustomer,
              metaFields: custMeta,
              isParent: true,
              child: siteChildren,
              nextInvoiceDayOfPeriod: cp['Billing Date'].trim() !== 'NULL' && cp['Billing Date'].trim() !== '' ? parseInt(cp['Billing Date'].trim()) : 1,
              nextInoviceDate: cp['Billing Date'].trim() !== 'NULL' && cp['Billing Date'].trim() !== '' ? `2025-08-${cp['Billing Date'].trim() === '1' ? '01' : cp['Billing Date'].trim()}` : '2025-08-01',
              userId: ++maxUserId
            });
          });

          return this.createAccount({
            customerId: ++maxCustomerId,
            userName: cp['CP ID'],
            accountTypeId: metaFieldGroupAccountTypeIdChannelPartner,
            metaFields: cpMeta,
            isParent: cpCustomers.length > 0,
            child: customerChildren,
            nextInvoiceDayOfPeriod: cp['Billing Date'].trim() !== 'NULL' && cp['Billing Date'].trim() !== '' ? parseInt(cp['Billing Date'].trim()) : 1,
            nextInoviceDate: cp['Billing Date'].trim() !== 'NULL' && cp['Billing Date'].trim() !== '' ? `2025-08-${cp['Billing Date'].trim() === '1' ? '01' : cp['Billing Date'].trim()}` : '2025-08-01',
            userId: ++maxUserId
          });
        });

        const upsertGraphInsertMissingNoDeleteNoUpdateNoRelate = await customerService.upsertGraphInsertMissingNoDeleteNoUpdateNoRelate(output, trx);
        if (upsertGraphInsertMissingNoDeleteNoUpdateNoRelate) {
          return {
            status: 200,
            data: {
              success: true,
              message: "Success: User Hierarchy Created",
              data: null
            }
          };
        }

        return {
          status: 200,
          data: {
            success: false,
            message: "Failure: User Hierarchy not created",
            data: channelPartners
          }
        };
      });
      return returnValue;
    } catch (error) {
      const csv = Papa.unparse([{ error: error?.message }]);
      const folderName =
        __dirname + "/../../../.." + `/userHierarchyErrorFiles`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const filename = `UserHierarchy-ErrorFile`;
      fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
      console.error("Error on User Hierarchy Update:", error);
      return {
        status: 200,
        data: {
          success: false,
          message: `Catch Error: Error on User Hierarchy UpsertGraph. ${error.message}`,
          error
        }
      };
    }
  }

  async parseCsvFile(fileName) {
    const filePath = path.join(__dirname, '/../../..', 'files', fileName);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  };

  createUser({ userName, userId }) {
    return {
      id: userId,
      entityId: 20,
      deleted: 0,
      languageId: 1,
      statusId: 1,
      subscriberStatus: 9,
      currencyId: 11,
      createDatetime: new Date(),
      userName,
      optlock: 1,
      encryptionScheme: 0,
      userRoleMap: { roleId: 32 },
    };
  }

  createAccount({ customerId, userName, accountTypeId, metaFields, isParent = false, child = [], nextInvoiceDayOfPeriod, nextInoviceDate, userId }) {
    return {
      id: customerId,
      invoiceDeliveryMethodId: 1,
      isParent: isParent ? 1 : 0,
      invoiceChild: 0,
      optlock: 1,
      dynamicBalance: 0,
      creditLimit: 0,
      autoRecharge: 0,
      useParentPricing: 'f',
      mainSubscriptOrderPeriodId: 200,
      nextInvoiceDayOfPeriod,
      nextInoviceDate,
      accountTypeId,
      user: this.createUser({ userName, userId }),
      metaFieldValue: metaFields,
      ...(child.length ? { child } : {}),
    };
  }

  createMeta(metaFieldId, metaFieldNameId, stringValue, groupId = null, booleanValue = null) {
    const meta = {
      id: metaFieldId,
      metaFieldNameId,
    };
    if (booleanValue !== null) {
      meta.dtype = "boolean";
      meta.booleanValue = booleanValue;
    } else {
      meta.dtype = "string";
      meta.stringValue = stringValue;
    }
    if (groupId) {
      meta.metafieldGroupMetaFieldMap = { metafieldGroupId: groupId };
    }
    return meta;
  }

  async serviceOrderLine() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const csvFilePath = path.join(__dirname, '/../../..', 'files', 'Services.csv');
        const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
        // Parse the CSV content
        const json = Papa.parse(csvFileContent, {
          header: true, // if you want to treat the first line as headers
          skipEmptyLines: true,
        });

        const data = json.data.filter(obj => obj['Service Status'] === 'Active'); // Parse the CSV content
        console.log('Services data length:', data.length);

        const uniqueCpIds = [
          ...new Set(
            data.map(item => item['CP ID'].trim())
          )
        ];
        console.log('Unique CP IDs length:', uniqueCpIds.length);

        const uniqueProductCodeIds = [
          ...new Set(
            data.map(item => item['Product Code'].trim())
          )
        ];
        console.log('Unique Product Codes length:', uniqueProductCodeIds.length);

        const getUserHierarchy = await baseUserService.getUserHierarchy(uniqueCpIds, trx);
        const getIdAndInternalNumber = await itemService.getIdAndInternalNumber(trx);
        const remainingObjects = uniqueProductCodeIds.filter(
          obj => !getIdAndInternalNumber.some(record => record.internalNumber.includes(obj))
        );
        const filteredRemainingObjects = data.filter(obj => remainingObjects.includes(obj['Product Code'].trim()));
        const csv = Papa.unparse(filteredRemainingObjects);
        const folderName =
          __dirname + "/../../../.." + `/serviceProductCodeNotFoundFiles`;
        if (!fs.existsSync(folderName)) {
          fs.mkdirSync(folderName, { recursive: true });
        }
        const filename = `Service-ProductCodeNotFoundFile`;
        fs.writeFileSync(`${folderName}/${filename}.csv`, csv);

        const remainingCpObjects = uniqueCpIds.filter(
          obj => !getUserHierarchy.some(record => record.userName.includes(obj))
        );
        const filteredRemainingCpObjects = data.filter(obj => remainingCpObjects.includes(obj['CP ID'].trim()));
        if (filteredRemainingCpObjects?.length > 0) {
          const csvCp = Papa.unparse(filteredRemainingCpObjects);
          const folderNameCP =
            __dirname + "/../../../.." + `/serviceCpIDNotFoundFiles`;
          if (!fs.existsSync(folderNameCP)) {
            fs.mkdirSync(folderNameCP, { recursive: true });
          }
          const filenameCp = `Service-CpIDNotFoundFile`;
          fs.writeFileSync(`${folderNameCP}/${filenameCp}.csv`, csvCp);
        }

        const getSiteServiceSetGroup = await metaFieldGroupService.getSiteServiceSetGroup(trx);
        const metaFieldGroupAccountTypeIdSiteService = parseInt(getSiteServiceSetGroup.accountTypeId);

        const getCustomerTypeName = await metaFieldNameService.getCustomerTypeName(trx);
        const metaFieldCustomerTypeNameId = parseInt(getCustomerTypeName.id);

        const getAccountTypeSiteIDId = await metaFieldNameService.getAccountTypeSiteIDId(trx);
        const metaFieldAccountTypeSiteIDId = parseInt(getAccountTypeSiteIDId.id);
        const getAccountTypeSiteNameId = await metaFieldNameService.getAccountTypeSiteNameId(trx);
        const metaFieldAccountTypeSiteNameId = parseInt(getAccountTypeSiteNameId.id);
        const getAccountTypeCustomerNameId = await metaFieldNameService.getAccountTypeCustomerNameId(trx);
        const metaFieldAccountTypeCustomerNameId = parseInt(getAccountTypeCustomerNameId.id);
        const getAccountTypeSiteCustomerIDId = await metaFieldNameService.getAccountTypeSiteCustomerIDId(trx);
        const metaFieldAccountTypeSiteCustomerIDId = parseInt(getAccountTypeSiteCustomerIDId.id);
        const getAccountTypeCustomerAndSiteCpIDId = await metaFieldNameService.getAccountTypeCustomerAndSiteCpIDId(trx);
        const metaFieldAccountTypeCustomerAndSiteCpIDId = parseInt(getAccountTypeCustomerAndSiteCpIDId.id);

        const getOrderServiceIDId = await metaFieldNameService.getOrderServiceIDId(trx);
        const metaFieldOrderServiceIDId = parseInt(getOrderServiceIDId.id);
        const getOrderCpIDId = await metaFieldNameService.getOrderCpIDId(trx);
        const metaFieldOrderCpIDId = parseInt(getOrderCpIDId.id);
        const getOrderCustomerIDId = await metaFieldNameService.getOrderCustomerIDId(trx);
        const metaFieldOrderCustomerIDId = parseInt(getOrderCustomerIDId.id);
        const getOrderServiceStatusId = await metaFieldNameService.getOrderServiceStatusId(trx);
        const metaFieldOrderServiceStatusId = parseInt(getOrderServiceStatusId.id);
        const getOrderServiceDescriptionId = await metaFieldNameService.getOrderServiceDescriptionId(trx);
        const metaFieldOrderServiceDescriptionId = parseInt(getOrderServiceDescriptionId.id);
        const getOrderProductCodeId = await metaFieldNameService.getOrderProductCodeId(trx);
        const metaFieldOrderProductCodeId = parseInt(getOrderProductCodeId.id);
        const getOrderLegacyIDId = await metaFieldNameService.getOrderLegacyIDId(trx);
        const metaFieldOrderLegacyIDId = parseInt(getOrderLegacyIDId.id);
        const getOrderESIDId = await metaFieldNameService.getOrderESIDId(trx);
        const metaFieldOrderESIDId = parseInt(getOrderESIDId.id);
        const getOrderDIDStartId = await metaFieldNameService.getOrderDIDStartId(trx);
        const metaFieldOrderDIDStartId = parseInt(getOrderDIDStartId.id);
        const getOrderDIDEndId = await metaFieldNameService.getOrderDIDEndId(trx);
        const metaFieldOrderDIDEndId = parseInt(getOrderDIDEndId.id);
        const getOrderIPAddressId = await metaFieldNameService.getOrderIPAddressId(trx);
        const metaFieldOrderIPAddressId = parseInt(getOrderIPAddressId.id);
        const getOrderContractTermId = await metaFieldNameService.getOrderContractTermId(trx);
        const metaFieldOrderContractTermId = parseInt(getOrderContractTermId.id);
        const getOrderSiteNameId = await metaFieldNameService.getOrderSiteNameId(trx);
        const metaFieldOrderSiteNameId = parseInt(getOrderSiteNameId.id);
        const getOrderCustomerNameId = await metaFieldNameService.getOrderCustomerNameId(trx);
        const metaFieldOrderCustomerNameId = parseInt(getOrderCustomerNameId.id);
        const getOrderCPNameId = await metaFieldNameService.getOrderCPNameId(trx);
        const metaFieldOrderCPNameId = parseInt(getOrderCPNameId.id);

        const getMaxMetaFieldValueId = await metaFieldValueService.maxId(trx);
        let metaFieldValueId = parseInt(getMaxMetaFieldValueId);
        const getMaxCustomerId = await customerService.maxId(trx);
        let customerId = parseInt(getMaxCustomerId);
        const getMaxUserId = await baseUserService.maxId(trx);
        let userId = parseInt(getMaxUserId);
        const getMaxOrderId = await purchaseOrderService.maxId(trx);
        let orderId = parseInt(getMaxOrderId);
        const getMaxOrderLineId = await orderLineService.maxId(trx);
        let orderLineId = parseInt(getMaxOrderLineId);

        const billingPeriodMap = {
          Monthly: 200,
          Annual: 300,
          Once: 1
        };

        // Find the site user node
        const result = [];

        const findSite = (channelPartner) => {
          const customers = channelPartner.customer.child || [];
          for (const customer of customers) {
            const sites = customer.child || [];
            for (const site of sites) {
              result.push({
                site,
                customer,
                channelPartner
              });
            }
          }
        };

        getUserHierarchy.forEach(findSite);

        const itemMap = Object.fromEntries(getIdAndInternalNumber.map(i => [i.internalNumber, i.id]));

        const output = [];

        for (const { site, customer, channelPartner } of result) {
          const channelPartnerUserName = channelPartner?.userName;
          const customerUserName = customer?.user?.userName;
          const siteUserName = site?.user?.userName;
          const matchingServices = data.filter(s => s["CP ID"].trim() === channelPartnerUserName
            && s["Customer ID"].trim() === customerUserName && s["Site ID"].trim() === siteUserName);

          if (!matchingServices.length) continue;

          const siteObject = {
            id: site.id,
            isParent: 1,
            child: []
          };

          for (const service of matchingServices) {
            const periodId = billingPeriodMap[service["Billing Period"].trim()];

            const account = {
              id: ++customerId,
              invoiceDeliveryMethodId: 1,
              isParent: 0,
              invoiceChild: 0,
              optlock: 1,
              dynamicBalance: 0,
              creditLimit: 0,
              autoRecharge: 0,
              useParentPricing: 'f',
              mainSubscriptOrderPeriodId: periodId,
              nextInvoiceDayOfPeriod: service["Billing Day"].trim() !== '' ? parseInt(service["Billing Day"].trim()) : 1,
              nextInoviceDate: service["Billing Day"].trim() !== '' && service["Billing Day"].trim() !== '1'
                && (service["Billing Period"].trim() === 'Monthly' || service["Billing Period"].trim() === 'Once')
                ? `2025-08-${service["Billing Day"].trim()}`
                : service["Billing Day"].trim() !== '' && service["Billing Period"].trim() === 'Annual' ? `2026-08-${service["Billing Day"].trim()}`
                  : '2025-09-01',
              accountTypeId: 304,
              user: {
                id: ++userId,
                entityId: 20,
                deleted: 0,
                languageId: 1,
                statusId: 1,
                subscriberStatus: 9,
                currencyId: 11,
                createDatetime: new Date(),
                userName: service["Service ID"].trim(),
                optlock: 1,
                encryptionScheme: 0,
                userRoleMap: {
                  roleId: 32
                }
              },
              metaFieldValue: [
                {
                  id: ++metaFieldValueId,
                  metaFieldNameId: metaFieldCustomerTypeNameId,
                  stringValue: service["Customer Name"].trim()
                },
                {
                  id: ++metaFieldValueId,
                  metaFieldNameId: metaFieldAccountTypeSiteIDId,
                  stringValue: service["Site ID"].trim(),
                  metafieldGroupMetaFieldMap: {
                    metaFieldGroupId: metaFieldGroupAccountTypeIdSiteService
                  }
                },
                {
                  id: ++metaFieldValueId,
                  metaFieldNameId: metaFieldAccountTypeSiteNameId,
                  stringValue: service["Site Name"].trim(),
                  metafieldGroupMetaFieldMap: {
                    metaFieldGroupId: metaFieldGroupAccountTypeIdSiteService
                  }
                },
                {
                  id: ++metaFieldValueId,
                  metaFieldNameId: metaFieldAccountTypeCustomerNameId,
                  stringValue: service["Customer Name"].trim(),
                  metafieldGroupMetaFieldMap: {
                    metaFieldGroupId: metaFieldGroupAccountTypeIdSiteService
                  }
                },
                {
                  id: ++metaFieldValueId,
                  metaFieldNameId: metaFieldAccountTypeSiteCustomerIDId,
                  stringValue: service["Customer ID"].trim(),
                  metafieldGroupMetaFieldMap: {
                    metaFieldGroupId: metaFieldGroupAccountTypeIdSiteService
                  }
                },
                {
                  id: ++metaFieldValueId,
                  metaFieldNameId: metaFieldAccountTypeCustomerAndSiteCpIDId,
                  stringValue: service["CP ID"].trim(),
                  metafieldGroupMetaFieldMap: {
                    metaFieldGroupId: metaFieldGroupAccountTypeIdSiteService
                  }
                }
              ]
            };

            const productCode = service["Product Code"].trim();
            const itemId = itemMap[productCode];
            const recurringPrice = service["Recurring Price"].trim();
            const contractStartDate = service["Contract Start Date"].trim();

            // Only add order if we have the itemId
            if (itemId && recurringPrice !== '' && contractStartDate !== '') {
              account.user.order = [
                {
                  id: ++orderId,
                  periodId,
                  billingTypeId: service["Billing Period"].trim() === 'Monthly' || service["Billing Period"].trim() === 'Annual' ? 1
                    : service["Billing Period"].trim() === 'Once' ? 2 : 1,
                  activeSince: service["Contract Start Date"].trim(),
                  createDatetime: new Date(),
                  createdBy: 10822,
                  statusId: 600,
                  currencyId: 11,
                  optlock: 1,
                  metaFieldValue: [
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderServiceIDId,
                      stringValue: service["Service ID"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCpIDId,
                      stringValue: service["CP ID"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCustomerIDId,
                      stringValue: service["Customer ID"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderServiceStatusId,
                      stringValue: service["Service Status"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderServiceDescriptionId,
                      stringValue: service["Service Description"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderProductCodeId,
                      stringValue: service["Product Code"].trim()
                    },
                    ...(service["Legacy SL"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderLegacyIDId,
                        stringValue: service["Legacy SL"].trim()
                      }]
                      : []),
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderESIDId,
                      stringValue: service["Site ID"].trim()
                    },
                    ...(service["DID Start"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderDIDStartId,
                        stringValue: service["DID Start"].trim()
                      }]
                      : []),
                    ...(service["DID End"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderDIDEndId,
                        stringValue: service["DID End"].trim()
                      }]
                      : []),
                    ...(service["IP Address"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderIPAddressId,
                        stringValue: service["IP Address"].trim()
                      }]
                      : []),
                    ...(service["Contract Term"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderContractTermId,
                        stringValue: service["Contract Term"].trim()
                      }]
                      : []),
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderSiteNameId,
                      stringValue: service["Site Name"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCustomerNameId,
                      stringValue: service["Customer Name"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCPNameId,
                      stringValue: service["CP Name"].trim()
                    }
                  ],
                  orderLine: [
                    {
                      id: ++orderLineId,
                      itemId,
                      typeId: 1,
                      amount: parseFloat(service["Recurring Price"].trim()),
                      quantity: parseInt(service["Quantity"].trim()),
                      price: parseFloat(service["Recurring Price"].trim()) / parseInt(service["Quantity"].trim()),
                      createDatetime: new Date(),
                      description: service["Service Description"].trim(),
                      optlock: 1,
                      useItem: 't'
                    }
                  ]
                }
              ];

              // Add separate order for establishment fee if exists
              if (service["Establishment Fee"].trim() !== '' && itemId && recurringPrice !== '' && contractStartDate !== '') {
                account.user.order.push({
                  id: ++orderId,
                  periodId: 1,
                  billingTypeId: 2,
                  activeSince: service["Contract Start Date"].trim(),
                  createDatetime: service["Contract Start Date"].trim(),
                  createdBy: 10822,
                  statusId: 600,
                  currencyId: 11,
                  optlock: 1,
                  metaFieldValue: [
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderServiceIDId,
                      stringValue: `${service["Service ID"].trim()}-EST`
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCpIDId,
                      stringValue: service["CP ID"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCustomerIDId,
                      stringValue: service["Customer ID"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderServiceStatusId,
                      stringValue: service["Service Status"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderServiceDescriptionId,
                      stringValue: service["Service Description"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderProductCodeId,
                      stringValue: service["Product Code"].trim()
                    },
                    ...(service["Legacy SL"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderLegacyIDId,
                        stringValue: service["Legacy SL"].trim()
                      }]
                      : []),
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderESIDId,
                      stringValue: service["Site ID"].trim()
                    },
                    ...(service["DID Start"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderDIDStartId,
                        stringValue: service["DID Start"].trim()
                      }]
                      : []),
                    ...(service["DID End"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderDIDEndId,
                        stringValue: service["DID End"].trim()
                      }]
                      : []),
                    ...(service["IP Address"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderIPAddressId,
                        stringValue: service["IP Address"].trim()
                      }]
                      : []),
                    ...(service["Contract Term"].trim() !== ''
                      ? [{
                        id: ++metaFieldValueId,
                        metaFieldNameId: metaFieldOrderContractTermId,
                        stringValue: service["Contract Term"].trim()
                      }]
                      : []),
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderSiteNameId,
                      stringValue: service["Site Name"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCustomerNameId,
                      stringValue: service["Customer Name"].trim()
                    },
                    {
                      id: ++metaFieldValueId,
                      metaFieldNameId: metaFieldOrderCPNameId,
                      stringValue: service["CP Name"].trim()
                    }
                  ],
                  orderLine: [
                    {
                      id: ++orderLineId,
                      itemId,
                      typeId: 1,
                      amount: parseFloat(service["Establishment Fee"].trim()),
                      quantity: 1,
                      price: parseFloat(service["Establishment Fee"].trim()),
                      createDatetime: new Date(),
                      description: "Establishment Fee",
                      optlock: 1,
                      useItem: 'f'
                    }
                  ]
                });
              }
            }

            siteObject.child.push(account);
          }

          output.push(siteObject);
        }

        const folderNameJson =
          __dirname + "/../../../.." + `/serviceJsonOutputFiles`;
        if (!fs.existsSync(folderNameJson)) {
          fs.mkdirSync(folderNameJson, { recursive: true });
        }
        const filenameJson = `Service-JsonOutputFile`;
        fs.writeFileSync(`${folderNameJson}/${filenameJson}.json`, JSON.stringify(output, null, 2));

        return {
          status: 200,
          data: {
            success: true,
            message: "Success: Service Data Generated",
            data: null
          }
        };
      });
      return returnValue;
    } catch (error) {
      const csv = Papa.unparse([{ error: error?.message }]);
      const folderName =
        __dirname + "/../../../.." + `/serviceOrderLineErrorFiles`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const filename = `ServiceOrderLine-ErrorFile`;
      fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
      console.error("Error on Service Order Line UpdateGraph:", error);
      return {
        status: 200,
        data: {
          success: false,
          message: `Catch Error: Error on Service Order Line UpsertGraph. ${error.message}`,
          error
        }
      };
    }
  }

  async productsDelete() {
    try {
      const returnValue = await Model.transaction(async (trx) => {
        const csvFilePath = path.join(__dirname, '/../../..', 'files', 'Products (1) - Products (1).csv');
        const csvFileContent = fs.readFileSync(csvFilePath, 'utf8');
        // Parse the CSV content
        const json = Papa.parse(csvFileContent, {
          header: true, // if you want to treat the first line as headers
          skipEmptyLines: true,
        });

        const data = json.data
        const uniqueGroupCodes = [
          ...new Set(
            data.map(item => item['Group Code'].trim())
          )
        ];
        console.log('Unique Group Codes length:', uniqueGroupCodes.length);
        const toRemove = ['3120100_BusinessLine', '2100000_SIP Phone'];
        const filteredGroupCodes = uniqueGroupCodes.filter(item => !toRemove.includes(item));
        const getProductRelation = await itemTypeEntityMapService.getProductRelation(filteredGroupCodes, trx);
        const itemTypeIds = [];
        const itemIds = [];
        const metaFieldValueIds = [];

        getProductRelation.forEach(entry => {
          // itemTypeId
          if (entry.itemTypeId) {
            itemTypeIds.push(entry.itemTypeId);
          }

          const items = entry.itemType?.item || [];

          items.forEach(item => {
            // item.id
            itemIds.push(item.id);

            // metaFieldValue.id
            item.metaFieldValue?.forEach(meta => {
              metaFieldValueIds.push(meta.id);
            });
          });
        });

        console.log("itemTypeIds.length:", itemTypeIds.length);
        console.log("itemIds.length:", itemIds.length);
        console.log("metaFieldValueIds.length:", metaFieldValueIds.length);

        const deleteItemTypeEntityMapByItemTypeId = await itemTypeEntityMapService.deleteItemTypeEntityMapByItemTypeId(itemTypeIds, trx);
        console.log("deleteItemTypeEntityMapByItemTypeId:", deleteItemTypeEntityMapByItemTypeId);
        const deleteItemTypeMapByItemTypeId = await itemTypeMapService.deleteItemTypeMapByItemTypeId(itemTypeIds, trx);
        console.log("deleteItemTypeMapByItemTypeId:", deleteItemTypeMapByItemTypeId);
        const deleteInternationalDescriptionByItemId = await internationalDescriptionService.deleteInternationalDescriptionByItemId(itemIds, trx);
        console.log("deleteInternationalDescriptionByItemId:", deleteInternationalDescriptionByItemId);
        const deleteItemEntityMapByItemId = await itemEntityMapService.deleteItemEntityMapByItemId(itemIds, trx);
        console.log("deleteItemEntityMapByItemId:", deleteItemEntityMapByItemId);
        const deleteItemMetaFieldMapByMetaFieldValueId = await itemMetaFieldMapService.deleteItemMetaFieldMapByMetaFieldValueId(metaFieldValueIds, trx);
        console.log("deleteItemMetaFieldMapByMetaFieldValueId:", deleteItemMetaFieldMapByMetaFieldValueId);
        const deleteItemById = await itemService.deleteItemById(itemIds, trx);
        console.log("deleteItemById:", deleteItemById);
        const deleteItemTypeById = await itemTypeService.deleteItemTypeById(itemTypeIds, trx);
        console.log("deleteItemTypeById:", deleteItemTypeById);

        if (deleteItemTypeEntityMapByItemTypeId.length > 0
          && deleteItemTypeMapByItemTypeId.length > 0
          && deleteInternationalDescriptionByItemId.length > 0
          && deleteItemEntityMapByItemId.length > 0
          && deleteItemMetaFieldMapByMetaFieldValueId.length > 0
          && deleteItemById.length > 0
          && deleteItemTypeById.length > 0
        ) {
          return {
            status: 200,
            data: {
              success: true,
              message: "Success: Products Deleted",
              data: {
                deleteItemTypeEntityMapByItemTypeId,
                deleteItemTypeMapByItemTypeId,
                deleteInternationalDescriptionByItemId,
                deleteItemEntityMapByItemId,
                deleteItemMetaFieldMapByMetaFieldValueId,
                deleteItemById,
                deleteItemTypeById
              }
            }
          }
        }
        return {
          status: 200,
          data: {
            success: false,
            message: "Failure: Products not deleted",
            data: {
              deleteItemTypeEntityMapByItemTypeId,
              deleteItemTypeMapByItemTypeId,
              deleteInternationalDescriptionByItemId,
              deleteItemEntityMapByItemId,
              deleteItemMetaFieldMapByMetaFieldValueId,
              deleteItemById,
              deleteItemTypeById
            }
          }
        }
      });
      return returnValue;
    } catch (error) {
      const csv = Papa.unparse([{ error: error?.message }]);
      const folderName =
        __dirname + "/../../../.." + `/productDeleteErrorFiles`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }
      const filename = `ProductDelete-ErrorFile`;
      fs.writeFileSync(`${folderName}/${filename}.csv`, csv);
      console.error("Error on Product Delete UpdateGraph:", error);
      return {
        status: 200,
        data: {
          success: false,
          message: `Catch Error: Error on Product Delete UpsertGraph. ${error.message}`,
          error
        }
      };
    }
  }
}

module.exports = new controller();