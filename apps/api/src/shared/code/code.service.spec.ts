/**
 * Copyright 2023 LINE Corporation
 *
 * LINE Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
import { faker } from '@faker-js/faker';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import MockDate from 'mockdate';
import { Repository } from 'typeorm';

import { UserDto } from '@/domains/user/dtos';
import { UserTypeEnum } from '@/domains/user/entities/enums';
import { mockRepository } from '@/utils/test-utils';

import { CodeTypeEnum } from './code-type.enum';
import { CodeEntity } from './code.entity';
import { CodeService } from './code.service';
import {
  SetCodeEmailVerificationDto,
  SetCodeResetPasswordDto,
  SetCodeUserInvitationDto,
} from './dtos/set-code.dto';

export const CodeServiceProviders = [
  CodeService,
  { provide: getRepositoryToken(CodeEntity), useValue: mockRepository() },
];

describe('CodeService', () => {
  let codeService: CodeService;
  let codeRepo: Repository<CodeEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: CodeServiceProviders,
    }).compile();
    codeService = module.get(CodeService);
    codeRepo = module.get(getRepositoryToken(CodeEntity));
  });

  describe('setCode', () => {
    it('set email verification type', async () => {
      const dto = new SetCodeEmailVerificationDto();
      dto.key = faker.datatype.string();
      dto.type = CodeTypeEnum.EMAIL_VEIRIFICATION;

      const code = await codeService.setCode(dto);

      expect(code).toHaveLength(6);
      expect(codeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          code,
          type: dto.type,
          key: dto.key,
          isVerified: false,
          data: undefined,
        }),
      );
    });
    it('set reset password type', async () => {
      const dto = new SetCodeResetPasswordDto();
      dto.key = faker.datatype.string();
      dto.type = CodeTypeEnum.RESET_PASSWORD;

      const code = await codeService.setCode(dto);

      expect(code).toHaveLength(6);
      expect(codeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          code,
          type: dto.type,
          key: dto.key,
          isVerified: false,
          data: undefined,
        }),
      );
    });
    it('set user invitation type with SUPER user type', async () => {
      const dto = new SetCodeUserInvitationDto();
      dto.key = faker.datatype.string();
      dto.type = CodeTypeEnum.USER_INVITATION;
      dto.data = {
        roleId: faker.datatype.number(),
        userType: UserTypeEnum.SUPER,
        invitedBy: new UserDto(),
      };

      const code = await codeService.setCode(dto);

      expect(code).toHaveLength(6);
      expect(codeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          code,
          type: dto.type,
          key: dto.key,
          isVerified: false,
          data: dto.data,
        }),
      );
    });
    it('set user invitation type with GENERAL user type', async () => {
      const dto = new SetCodeUserInvitationDto();
      dto.key = faker.datatype.string();
      dto.type = CodeTypeEnum.USER_INVITATION;
      dto.data = {
        roleId: faker.datatype.number(),
        userType: UserTypeEnum.GENERAL,
        invitedBy: new UserDto(),
      };

      const code = await codeService.setCode(dto);

      expect(code).toHaveLength(6);
      expect(codeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          code,
          type: dto.type,
          key: dto.key,
          isVerified: false,
          data: dto.data,
        }),
      );
    });
  });
  describe('verifyCode', () => {
    const codeEntity: CodeEntity = new CodeEntity();
    const key = faker.datatype.string();
    beforeEach(async () => {
      codeEntity.code = faker.datatype.string(6);
      codeEntity.key = key;
      codeEntity.type = CodeTypeEnum.EMAIL_VEIRIFICATION;
      codeEntity.isVerified = false;
      codeEntity.id = faker.datatype.number();
      codeEntity.expiredAt = dayjs().add(5, 'minutes').toDate();
    });
    it('verify code with valid code, key, type', async () => {
      const { code, type } = codeEntity;
      jest.spyOn(codeRepo, 'findOneBy').mockResolvedValue(codeEntity);

      await codeService.verifyCode({ code, key, type });

      expect(codeRepo.findOneBy).toHaveBeenCalledWith({
        key: codeEntity.key,
        type: codeEntity.type,
      });
      expect(codeRepo.update).toHaveBeenCalledWith(
        {
          id: codeEntity.id,
        },
        { id: codeEntity.id, isVerified: true },
      );
    });
    it('verify code with invalid code', async () => {
      const { type } = codeEntity;
      const invalidCode = faker.datatype.string(6);
      jest.spyOn(codeRepo, 'findOneBy').mockResolvedValue(codeEntity);

      await expect(
        codeService.verifyCode({
          code: invalidCode,
          key,
          type,
        }),
      ).rejects.toThrow(BadRequestException);
    });
    it('verify code with invalid key', async () => {
      const { code, type } = codeEntity;
      const invalidKey = faker.datatype.string(6);
      jest.spyOn(codeRepo, 'findOneBy').mockResolvedValue(null);

      await expect(
        codeService.verifyCode({
          code,
          key: invalidKey,
          type,
        }),
      ).rejects.toThrow(NotFoundException);
    });
    it('verify code at expired date', async () => {
      MockDate.set(new Date(Date.now() + 5 * 60 * 1000 + 1000));
      const { code, type } = codeEntity;
      jest.spyOn(codeRepo, 'findOneBy').mockResolvedValue(codeEntity);

      await expect(codeService.verifyCode({ code, key, type })).rejects.toThrow(
        BadRequestException,
      );
      MockDate.reset();
    });
  });
});