import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message!: string;

  data!: T;
}

export const ApiSuccessResponse = <DataDto extends Type<unknown>>(
  dataDto?: DataDto,
  message: string = 'Operation successful',
) => {
  const schema = {
    allOf: [
      { $ref: getSchemaPath(ApiResponseDto) },
      {
        properties: {
          message: {
            type: 'string',
            example: message,
          },
          ...(dataDto
            ? {
                data: {
                  $ref: getSchemaPath(dataDto),
                },
              }
            : {
                data: {
                  type: 'null',
                  example: null,
                },
              }),
        },
      },
    ],
  };

  const decorators = [
    ApiExtraModels(ApiResponseDto),
    ApiOkResponse({ schema }),
  ];

  if (dataDto) {
    decorators.unshift(ApiExtraModels(dataDto));
  }

  return applyDecorators(...decorators);
};
