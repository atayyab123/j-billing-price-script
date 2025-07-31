const model = require("../models/metaFieldName.model");

class service {
  async getGroupCode(trx) {
    const data = await model.query(trx)
      .where('name', 'Group Code')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getTerm(trx) {
    const data = await model.query(trx)
      .where('name', 'Term')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'DECIMAL')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getTaxScheme(trx) {
    const data = await model.query(trx)
      .where('name', 'Tax Scheme')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'ENUMERATION')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getRecurringCharge(trx) {
    const data = await model.query(trx)
      .where('name', 'Recurring Charge')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'DECIMAL')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getEstablishmentCharge(trx) {
    const data = await model.query(trx)
      .where('name', 'Establishment Charge')
      .andWhere('entityType', 'PRODUCT')
      .andWhere('dataType', 'DECIMAL')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getCustomerTypeName(trx) {
    const data = await model.query(trx)
      .where('name', 'Name')
      .andWhere('entityType', 'CUSTOMER')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getCustomerTypeGST(trx) {
    const data = await model.query(trx)
      .where('name', 'GST')
      .andWhere('entityType', 'CUSTOMER')
      .andWhere('dataType', 'BOOLEAN')
      .andWhere('entityId', 20)
      .first();
    return data;
  }

  async getAccountTypeCpId(trx) {
    const data = await model.query(trx)
      .where('name', 'CP ID')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 296)
      .first();
    return data;
  }

  async getAccountTypeChannelPartnerNameId(trx) {
    const data = await model.query(trx)
      .where('name', 'Name')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 298)
      .first();
    return data;
  }

  async getAccountTypeCpEmailId(trx) {
    const data = await model.query(trx)
      .where('name', 'Email')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 274)
      .first();
    return data;
  }

  async getAccountTypeCpOfficePhoneId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office Phone')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 291)
      .first();
    return data;
  }

  async getAccountTypeCpOfficeFaxId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office Fax')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 275)
      .first();
    return data;
  }

  async getAccountTypeCpAbnAcnId(trx) {
    const data = await model.query(trx)
      .where('name', 'ABN/ACN')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 277)
      .first();
    return data;
  }

  async getAccountTypeCpOfficeStreetId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office Street')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 295)
      .first();
    return data;
  }

  async getAccountTypeCpOfficeCityId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office City')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 283)
      .first();
    return data;
  }

  async getAccountTypeCpOfficeStateId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office State')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 292)
      .first();
    return data;
  }

  async getAccountTypeCpOfficePostcodeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office Postcode')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 293)
      .first();
    return data;
  }

  async getAccountTypeCpOfficeCountryId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office Country')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 300)
      .first();
    return data;
  }

  async getAccountTypeCpPostalStreetId(trx) {
    const data = await model.query(trx)
      .where('name', 'Postal Street')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 271)
      .first();
    return data;
  }

  async getAccountTypeCpPostalCityId(trx) {
    const data = await model.query(trx)
      .where('name', 'Postal City')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 270)
      .first();
    return data;
  }

  async getAccountTypeCpPostalStateId(trx) {
    const data = await model.query(trx)
      .where('name', 'Postal State')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 242)
      .first();
    return data;
  }

  async getAccountTypeCpPostalPostcodeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Postal Postcode')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 241)
      .first();
    return data;
  }

  async getAccountTypeCpPostalCountryId(trx) {
    const data = await model.query(trx)
      .where('name', 'Postal Country')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 301)
      .first();
    return data;
  }

  async getAccountTypeCustomerIDId(trx) {
    const data = await model.query(trx)
      .where('name', 'Customer ID')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 251)
      .first();
    return data;
  }

  async getAccountTypeCustomerNameId(trx) {
    const data = await model.query(trx)
      .where('name', 'Customer Name')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 255)
      .first();
    return data;
  }

  async getAccountTypeCustomerLevelId(trx) {
    const data = await model.query(trx)
      .where('name', 'Level')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 234)
      .first();
    return data;
  }

  async getAccountTypeCustomerSubAddressTypeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Sub Address Type')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 237)
      .first();
    return data;
  }

  async getAccountTypeCustomerSubAddressNumberId(trx) {
    const data = await model.query(trx)
      .where('name', 'Sub Address Number')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 252)
      .first();
    return data;
  }

  async getAccountTypeCustomerStreetNumberId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Number')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 266)
      .first();
    return data;
  }

  async getAccountTypeCustomerStreetNumberSuffixId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Number Suffix')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 265)
      .first();
    return data;
  }

  async getAccountTypeCustomerStreetNameId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Name')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 253)
      .first();
    return data;
  }

  async getAccountTypeCustomerStreetTypeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Type')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 239)
      .first();
    return data;
  }

  async getAccountTypeCustomerStreetTypeSuffixId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Type Suffix')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 254)
      .first();
    return data;
  }

  async getAccountTypeCustomerSuburbId(trx) {
    const data = await model.query(trx)
      .where('name', 'Suburb')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 238)
      .first();
    return data;
  }

  async getAccountTypeCustomerStateId(trx) {
    const data = await model.query(trx)
      .where('name', 'State')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 256)
      .first();
    return data;
  }

  async getAccountTypeCustomerPostcodeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Postcode')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 250)
      .first();
    return data;
  }

  async getAccountTypeCustomerOfficePhoneId(trx) {
    const data = await model.query(trx)
      .where('name', 'Office Phone')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 233)
      .first();
    return data;
  }

  async getAccountTypeCustomerEmailId(trx) {
    const data = await model.query(trx)
      .where('name', 'Email')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 276)
      .first();
    return data;
  }

  async getAccountTypeCustomerAndSiteCpIDId(trx) {
    const data = await model.query(trx)
      .where('name', 'CP ID')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 260)
      .first();
    return data;
  }

  async getAccountTypeSiteIDId(trx) {
    const data = await model.query(trx)
      .where('name', 'Site ID')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 267)
      .first();
    return data;
  }

  async getAccountTypeSiteNameId(trx) {
    const data = await model.query(trx)
      .where('name', 'Site Name')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 294)
      .first();
    return data;
  }

  async getAccountTypeSiteLevelId(trx) {
    const data = await model.query(trx)
      .where('name', 'Level')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 269)
      .first();
    return data;
  }

  async getAccountTypeSiteSubAddressTypeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Sub Address Type')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 259)
      .first();
    return data;
  }

  async getAccountTypeSiteSubAddressNumberId(trx) {
    const data = await model.query(trx)
      .where('name', 'Sub Address Number')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 263)
      .first();
    return data;
  }

  async getAccountTypeSiteStreetNumberId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Number')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 235)
      .first();
    return data;
  }

  async getAccountTypeSiteStreetNumberSuffixId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Number Suffix')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 236)
      .first();
    return data;
  }

  async getAccountTypeSiteStreetNameId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Name')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 279)
      .first();
    return data;
  }

  async getAccountTypeSiteStreetTypeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Type')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 262)
      .first();
    return data;
  }

  async getAccountTypeSiteStreetTypeSuffixId(trx) {
    const data = await model.query(trx)
      .where('name', 'Street Type Suffix')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 268)
      .first();
    return data;
  }

  async getAccountTypeSiteSuburbId(trx) {
    const data = await model.query(trx)
      .where('name', 'Suburb')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 278)
      .first();
    return data;
  }

  async getAccountTypeSiteStateId(trx) {
    const data = await model.query(trx)
      .where('name', 'State')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 258)
      .first();
    return data;
  }

  async getAccountTypeSitePostcodeId(trx) {
    const data = await model.query(trx)
      .where('name', 'Postcode')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 257)
      .first();
    return data;
  }

  async getAccountTypeSiteCountryId(trx) {
    const data = await model.query(trx)
      .where('name', 'Country')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 299)
      .first();
    return data;
  }

  async getAccountTypeSiteMainPhoneId(trx) {
    const data = await model.query(trx)
      .where('name', 'Site Main Phone')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 261)
      .first();
    return data;
  }

  async getAccountTypeSiteCustomerIDId(trx) {
    const data = await model.query(trx)
      .where('name', 'Customer ID')
      .andWhere('entityType', 'ACCOUNT_TYPE')
      .andWhere('dataType', 'STRING')
      .andWhere('entityId', 20)
      .andWhere('id', 297)
      .first();
    return data;
  }
}
module.exports = new service();
